window.addEventListener("DOMContentLoaded", async () => {
  // find P elements and convert into DIVs
  const ps = [...document.querySelectorAll("p")].filter(p => p.textContent.trim().startsWith("ob:"))
  ps.forEach(p => {
    const parent = p.parentNode
    const div = document.createElement('div')
    div.dataset.ob = p.textContent.trim().split(":")[1]
    parent.insertBefore(div, p)
    parent.removeChild(p)
  })

  // find elements to embed cells
  const cells = [...document.querySelectorAll("[data-ob]")].map((element) => {
    const data = element.dataset.ob
    const [, notebookKey, cellName] = data.match(/^(.+\/.+)\/(.+)$/)
    return {
      element,
      notebookKey,
      cellName,
    }
  })

  if (!cells.length) return

  // load notebooks
  const {Runtime, Inspector} = await import("https://cdn.jsdelivr.net/npm/@observablehq/runtime@4/dist/runtime.js")
  const notebookKeys = [...new Set(cells.map((c) => c.notebookKey))]
  const notebookModules = await Promise.all(
    notebookKeys.map(key => import(`https://api.observablehq.com/@${key}.js?v=3`))
  )
  const notebooks = notebookModules.map((obj, i) => ({
    key: notebookKeys[i],
    module: obj.default,
  }))

  // embed cells into elements
  notebooks.forEach((nb) => {
    new Runtime().module(nb.module, (cellName) => {
      const cell = cells.find((c) => c.notebookKey == nb.key && c.cellName === cellName)
      if (cell) return new Inspector(cell.element)
    })
  })
})