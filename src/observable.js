window.addEventListener("DOMContentLoaded", async () => {
  // find candidate elements, and convert into target elements
  const candidateTags = new Set(['em', 'strong', 'i', 'b', 'span', 'q', 'p', 'div', 'blockquote', 'li'])
  const candidates = [...document.querySelectorAll([...candidateTags].join(','))]
  candidates
    .filter(e => e.textContent.trim().startsWith("ob:"))
    .forEach(e => {
      const parent = e.parentNode
      const wrapper = document.createElement(e.tagName)
      wrapper.dataset.ob = e.textContent.trim().split(":")[1]
      parent.insertBefore(wrapper, e)
      parent.removeChild(e)
    })

  // find target elements
  const cells = [...document.querySelectorAll("[data-ob]")].map((e) => {
    const [, notebookKey, cellName] = e.dataset.ob.match(/^(.+\/.+)\/(.+)$/)
    return {
      element: e,
      notebookKey,
      cellName,
    }
  })
  if (!cells.length) return
  const cellMap = Object.fromEntries(cells.map(c => [`${c.notebookKey}/${c.cellName}`, c]))

  // load notebooks
  const notebookKeys = [...new Set(cells.map((c) => c.notebookKey))]
  const [{Runtime, Inspector}, notebookModules] = await Promise.all([
    import("https://cdn.jsdelivr.net/npm/@observablehq/runtime@4/dist/runtime.js"),
    Promise.all(notebookKeys.map(key => import(`https://api.observablehq.com/@${key}.js?v=3`))),
  ])
  const notebooks = notebookModules.map((obj, i) => ({
    key: notebookKeys[i],
    module: obj.default,
  }))

  // embed cells into backstage
  const backstage = document.createElement('div')
  backstage.style.display = 'none'
  document.body.appendChild(backstage)
  notebooks.forEach((nb) => {
    new Runtime().module(nb.module, (cellName) => {
      const key = `${nb.key}/${cellName}`
      const wrapperTag = cellMap[key] ? cellMap[key].element.tagName : 'div'
      const wrapper = document.createElement(wrapperTag)
      wrapper.dataset.ob = key
      backstage.appendChild(wrapper)
      return new Inspector(wrapper)
    })
  })

  // move cells into stage
  notebooks.forEach((nb) => {
    new Runtime().module(nb.module, (cellName) => {
      const cell = cells.find((c) => c.notebookKey == nb.key && c.cellName === cellName)
      if (!cell) return

      const element = backstage.querySelector(`[data-ob="${nb.key}/${cellName}"]`)
      element.style.overflowX = "auto";
      cell.element.parentNode.insertBefore(element, cell.element)
      cell.element.parentNode.removeChild(cell.element)
    })
  })
})
