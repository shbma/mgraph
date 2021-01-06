/**
 *  https://visjs.github.io/vis-network/docs/network/ -- док. по работе на холсте с графом
 */

export let selectorsID = ["relationshipEnd", "relationshipStart",
    "nodeSelect", "oneWayFilterSelector", "depthFilterSelector"]
export let vizIDa = 'viz'
export let topicsID = [] //["newTopic", "topic"] // аккуратно удалить в будущем (есть  в коде updateMenu)
export let serverUrl = "neo4j://176.57.217.75:7687"
// будет хранить в реляционной БД
export let communities = []
export let newPropertysLabelCount = 0
export let newPropertysTypeCount = 0
export let deskDefault = "Basic"
export let firstNodeID = -1
export let secondNodeID = -1
export let vizualHandlersApplyed = false
export const deskInterest = {
    RELATION: 0,
    DESK: 1,
    RELDESK : 2
}