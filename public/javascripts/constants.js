/**
 *  https://visjs.github.io/vis-network/docs/network/ -- док. по работе на холсте с графом
 */

let viz
let driver
let username, password
let updateHandler
let selectorsID = ["relationshipEnd", "relationshipStart",
    "nodeSelect", "oneWayFilterSelector", "depthFilterSelector", 
    "pathP2PfilterSelectorA", "pathP2PfilterSelectorB"]
let topicsID = [] //["newTopic", "topic"] // аккуратно удалить в будущем (есть  в коде updateMenu)
let serverUrl = "neo4j://176.57.217.75:7687"
// будет хранить в реляционной БД
let communities = []
let newPropertysLabelCount = 0
let newPropertysTypeCount = 0
let config
let desk = ""
let deskDefault = "Basic"
let vizualHandlersApplyed = false
const deskInterest = {
    RELATION: 0,
    DESK: 1,
    RELDESK : 2
}
let idVisualRealMap = { // двусторонний словрь visualID<->realID
        'byVisual': {},
        'byReal': {},        
        getByVisual: (vid) => { return this.byVisual[vid]},
        getByReal: (rid) => { return this.byReal[rid]},                
    }
let nodesBank = {} // хранилище вершин, отобажаемых на холсте {visualID:node, ...}