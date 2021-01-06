export function clickOnULSearch(event, node, UL) {    
    let selectedNodeId = event.target.closest("li").value
    let nodeSelector = document.getElementById("nodeSelect")
    for (let i = 0; i < nodeSelector.options.length; i++){
        if (nodeSelector.options[i].value == selectedNodeId) {
            document.getElementById(node).value = nodeSelector.options[i].text
            realId = nodeSelector.options[i].value
            rememberBeforeSearchPos()
            focusOnNode(realId)
            clearUL(UL)            
            return
        }
    }
}

export function rememberBeforeSearchPos(){
    let focus = viz._network.getViewPosition()
    $('.previous-cord-box').attr('x', focus.x)
    $('.previous-cord-box').attr('y', focus.y)        
}

export function restoreBeforeSearchPos(){
    let xOld = parseInt($('.previous-cord-box').attr('x'))
    let yOld = parseInt($('.previous-cord-box').attr('y'))        
    setCanvasFocusNearPoint({x: xOld, y: yOld})
}

export function clearUL(UL) {
    let list = document.getElementById(UL)
    while (list.hasChildNodes()) {
        list.removeChild(list.firstChild);
    }
}

export function clickOnUL(event) {
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

export function searchNodeByName(inputNode, UL, clickOnULexport) {
    let inputField = document.getElementById(inputNode)
    let input = inputField.value.toLowerCase().trim()
    let list = document.getElementById(UL)
    clearUL(UL)
    if (input === ""){return}
    let nodeSelector = document.getElementById("nodeSelect")
    //inputField.addEventListener("keyup", (event) => { if (event.key === "Enter") { console.log('Enter') } });
    for (let i = 0; i < nodeSelector.options.length; i++){
        if (nodeSelector.options[i].text.toLowerCase().indexOf(input) >= 0) {
            //console.log(input + " : " + nodeSelector.options[i].text.toLowerCase())
            let li = document.createElement("li")
            li.value = nodeSelector.options[i].value
            li.onclick = (event) => clickOnULexport(event, inputNode, UL)            
            let a = document.createElement("a")
            a.text = nodeSelector.options[i].text

            li.appendChild(a)
            list.appendChild(li)
        }
    }
}
