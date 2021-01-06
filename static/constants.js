/**
 *  https://visjs.github.io/vis-network/docs/network/ -- док. по работе на холсте с графом
 */

let viz
let driver
let username, password
let updateHandler
let selectorsID = ["relationshipEnd", "relationshipStart",
    "nodeSelect", "oneWayFilterSelector", "depthFilterSelector"]
let topicsID = ["newTopic", "topic"]
let serverUrl = "neo4j://176.57.217.75:7687"
// будет хранить в реляционной БД
let communities = []
let newPropertysLabelCount = 0
let newPropertysTypeCount = 0
let config
let desk = ""
let deskDefault = "Basic"
let firstNodeID = -1
let secondNodeID = -1
let vizualHandlersApplyed = false
const deskInterest = {
    RELATION: 0,
    DESK: 1,
    RELDESK : 2
}
let selectedNode
let lastLabel
let properties = []
let finishedUpdateCount
let nodeIdAtCanvas
let isUpdateFinished
let isFirstClick = true