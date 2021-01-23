/* переход фокуса камеры на кликнутый элемент списка результатов поиска */
function clickOnULSearch(event, realId, UL) {    
    rememberBeforeSearchPos()
    focusOnNode(realId)
    clearUL(UL)            
}

function rememberBeforeSearchPos(){
    let focus = viz._network.getViewPosition()
    $('.previous-cord-box').attr('x', focus.x)
    $('.previous-cord-box').attr('y', focus.y)        
}

function restoreBeforeSearchPos(){
    let xOld = parseInt($('.previous-cord-box').attr('x'))
    let yOld = parseInt($('.previous-cord-box').attr('y'))        
    setCanvasFocusNearPoint({x: xOld, y: yOld})
}

function clearUL(UL) {
    let list = document.getElementById(UL)
    while (list.hasChildNodes()) {
        list.removeChild(list.firstChild);
    }
}

/* поиск на холсте по названиям вершин */
function searchNodeByName(inputNode, UL, clickOnULFunction) {
    let inputField = document.getElementById(inputNode)
    let input = inputField.value.toLowerCase().trim()
    let list = document.getElementById(UL)
    clearUL(UL)
    if (input === ""){
        return
    }
    Object.keys(nodesBank).forEach((keyVisualID) => {
        if (nodesBank[keyVisualID].title.toLowerCase().indexOf(input) >= 0) {
            //console.log(input + " : " + nodeSelector.options[i].text.toLowerCase())
            let realId = nodesBank[keyVisualID].id
            let li = document.createElement("li")            
            li.value = realId
            li.onclick = (event) => clickOnULFunction(event, realId, UL)            
            
            let a = document.createElement("a")
            a.text = nodesBank[keyVisualID].title

            li.appendChild(a)
            list.appendChild(li)
        }
    })
}
