async function populateTable() {
    const storedData = await browser.storage.sync.get("DLSorter");
    console.log(storedData);
    if (storedData.DLSorter == undefined) {
      await browser.storage.sync.set({ DLSorter: [] });
    }
    const data = storedData.DLSorter || [];
    let table = document.getElementById("rules");
  
    data.forEach((item, index) => {
      let row = document
        .getElementsByTagName("template")[0]
        .content.cloneNode(true).firstElementChild;
      row.id = item.id;
      row.setAttribute("nr", index);
  
      // Add drag and drop attributes
      row.setAttribute("draggable", "true");
      row.classList.add("cursor-move");
  
      // Add drag event listeners
      row.addEventListener("dragstart", handleDragStart);
      row.addEventListener("dragend", handleDragEnd);
      row.addEventListener("dragover", handleDragOver);
      row.addEventListener("dragleave", handleDragLeave);
      row.addEventListener("drop", handleDrop);
  
      row.children[0].innerText = item.pattern;
      row.children[1].innerText = item.filePattern;
      row.children[2].innerText = item.dir;
  
      row.children[4].children[1].addEventListener("click", (e) => {
        editDialog.children[0].children[2].children[0].children[1].value =
          row.children[0].innerText;
        editDialog.children[0].children[2].children[0].children[3].value =
          row.children[1].innerText;
        editDialog.children[0].children[2].children[0].children[5].value =
          row.children[2].innerText;
        editDialog.setAttribute("changeId", row.id);
        editDialog.showModal();
      });
  
      row.children[4].children[0].onclick = async (e) => {
        await del(row);
      };
      row.children[3].children[0].checked = item.enabled;
      row.children[3].children[0].onchange = async (e) => {
        await toggle(e);
      };
      table.appendChild(row);
    });
  }