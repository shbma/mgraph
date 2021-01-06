import {
	selectorsID, vizIDa, serverUrl, deskInterest, deskDefault,
	newPropertysLabelCount, newPropertysTypeCount, vizualHandlersApplyed, topicsID
	} from '/javascripts/constants.js'
import {getDeskName, getActualDeskId, getActualTypoId} from '/javascripts/desks.js'
import {getGraphInfo} from '/javascripts/login_init.js'
import {autosize} from '/javascripts/common.js'


let viz
let driver
let config
let desk

// При загрузке документа
$(document).ready(async function() {
    await getGraphInfo(driver, viz, vizIDa, config); // сразу входим и загружаем граф

    //всем textarea - автоподстройка высоты под содрежимое
    document.querySelectorAll('textarea').forEach((area) => {        
        area.addEventListener('input', (event)=>{
        	autosize(event.target)
        });
    });
});


