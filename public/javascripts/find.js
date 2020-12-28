function clickOnULSearch(event, node, UL) {
    console.log('clickOnULSearch')
    let selectedNodeId = event.target.closest("li").value
    let nodeSelector = document.getElementById("nodeSelect")
    for (let i = 0; i < nodeSelector.options.length; i++){
        if (nodeSelector.options[i].value == selectedNodeId) {
            document.getElementById(node).value = nodeSelector.options[i].text
            realId = nodeSelector.options[i].value
            focusOnNode(realId)
            clearUL(UL)            
            return
        }
    }
}

function clearUL(UL) {
    let list = document.getElementById(UL)
    while (list.hasChildNodes()) {
        list.removeChild(list.firstChild);
    }
}

function clickOnUL(event) {
    let selectedNodeId = event.target.closest("li").value
    let nodeSelector = document.getElementById("nodeSelect")
    for (let i = 0; i < nodeSelector.options.length; i++){
        if (nodeSelector.options[i].value == selectedNodeId) {
            nodeSelector.selectedIndex = i
            getSelectedNodeInfo()
            return
        }
    }
}

function searchNodeByName(inputNode, UL, clickOnULFunction) {
    let inputField = document.getElementById(inputNode)
    let input = inputField.value.toLowerCase().trim()
    let list = document.getElementById(UL)
    clearUL(UL)
    if (input === ""){return}
    let nodeSelector = document.getElementById("nodeSelect")
    /*inputField.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            console.log('Enter')
        }
    });*/
    for (let i = 0; i < nodeSelector.options.length; i++){
        if (nodeSelector.options[i].text.toLowerCase().indexOf(input) >= 0) {
            console.log(input + " : " + nodeSelector.options[i].text.toLowerCase())
            let li = document.createElement("li")
            li.value = nodeSelector.options[i].value
            li.onclick = (event) => clickOnULFunction(event, inputNode, UL)            
            let a = document.createElement("a")
            a.text = nodeSelector.options[i].text

            li.appendChild(a)
            list.appendChild(li)
        }
    }
}
