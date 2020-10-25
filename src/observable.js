window.addEventListener("DOMContentLoaded", async () => {
  async function main() {
    convertTextBasedNotation()
    const cellMap = findTargetElements()
    const backstage = await loadNotebooks(cellMap)
    embedCells(backstage, cellMap)
  }

  function convertTextBasedNotation() {
    const candidateTags = new Set(["em", "strong", "i", "b", "span", "q", "p", "div", "blockquote", "li"])
    const candidates = [...document.querySelectorAll([...candidateTags].join(","))]
    candidates
      .filter((e) => (e.textContent || "").trim().startsWith("ob:"))
      .forEach((e) => {
        const parent = e.parentNode
        if (!parent) return

        const wrapper = document.createElement(e.tagName)
        wrapper.dataset.ob = (e.textContent || "").trim().split(":")[1]
        parent.insertBefore(wrapper, e)
        parent.removeChild(e)
      })
  }

  function findTargetElements() {
    /** @type {NodeListOf<HTMLElement>} */
    const obElements = document.querySelectorAll("[data-ob]")
    const cells = [...obElements].map((e) => {
      const [, notebookKey, cellName] = (e.dataset.ob || "").match(/^(.+\/.+)\/(.+)$/) || []
      return {
        element: e,
        notebookKey,
        cellName,
      }
    })
    return Object.fromEntries(cells.map((c) => [`${c.notebookKey}/${c.cellName}`, c]))
  }

  /**
   * @param {Record<string, Record<string, any>>} cellMap
   */
  async function loadNotebooks(cellMap) {
    // create backstage element to hold all notebook cells
    const backstage = document.createElement("div")
    backstage.style.display = "none"

    // notebooks to load
    const notebookKeys = [...new Set(Object.values(cellMap).map((c) => c.notebookKey))]
    if (!notebookKeys.length) return backstage

    // load Observable Runtime and notebooks
    const [{ Runtime, Inspector }, notebookModules] = await Promise.all([
      // @ts-ignore
      import("https://cdn.jsdelivr.net/npm/@observablehq/runtime@4/dist/runtime.js"),
      Promise.all(notebookKeys.map((key) => import(`https://api.observablehq.com/@${key}.js?v=3`))),
    ])
    const notebookMap = Object.fromEntries(notebookModules.map((obj, i) => [notebookKeys[i], obj.default]))

    // load notebook cells into backstage
    Object.entries(notebookMap).forEach(([nbKey, nbModule]) => {
      new Runtime().module(
        nbModule,
        /**
         * @param {string} cellName
         */
        (cellName) => {
          const key = `${nbKey}/${cellName}`
          const wrapperTag = cellMap[key] ? cellMap[key].element.tagName : "div"
          const wrapper = document.createElement(wrapperTag)
          wrapper.dataset.ob = key
          backstage.appendChild(wrapper)
          return new Inspector(wrapper)
        },
      )
    })

    return backstage
  }

  /**
   * @param {HTMLElement} backstage
   * @param {Record<string, Record<string, any>>} cellMap
   */
  function embedCells(backstage, cellMap) {
    Object.entries(cellMap).forEach(([key, cell]) => {
      /** @type {HTMLElement | null} */
      const element = backstage.querySelector(`[data-ob="${key}"]`)
      if (!element) return

      element.style.overflowX = "auto"
      cell.element.parentNode.insertBefore(element, cell.element)
      cell.element.parentNode.removeChild(cell.element)
    })
  }

  await main()
})
