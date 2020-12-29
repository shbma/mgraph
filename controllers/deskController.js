

// Показать подробную информацию для данной доски.
exports.desk = function(req, res, next) {		
	let cypher = ''
	if (req.params.deskID != undefined) {				
        // выбираем доску плюс связанные с ней предметные и типологические доски
        cypher = `MATCH (d:Доска {id:`+req.params.deskID+`}) 
                   CALL {
                     WITH d 
                     OPTIONAL MATCH (t:Доска {type:"Типология"})<-[:subsection {type:"ИСПОЛЬЗУЕТ"}]-(d) 
                     RETURN t AS typ
                   } 
                   CALL {
                    WITH d 
                    OPTIONAL MATCH (p:Доска {type:"Предметная"})-[:subsection {type:"ИСПОЛЬЗУЕТ"}]->(d) 
                    RETURN p AS subj
                   } 
                   RETURN d.id, d.title, d.type, typ.id, typ.title, subj.id, subj.title`
	} else { 
		// Берем преметную доску с меньшим id.   TODO: брать последнюю просмотренную		
		cypher = 'MATCH (a:Доска {type:"Предметная"}) WITH collect(a)[0] AS s RETURN s.id, s.title, s.type;'
	}
	
	req.neo4j.read(cypher)
        .then(data => {        	
        	let records = req.neo4j.beautify(data.records)
            console.log(records)            
            if (records[0]['d.type'] == 'Предметная'){
                res.render('main/indexSubject', { 
                    desk: { 
                        id: records[0]['d.id'],
                        type: records[0]['d.type'],
                        title: records[0]['d.title']
                        },
                    typo: { 
                        id: records[0]['typ.id'],
                        type: records[0]['d.type'],
                        title: records[0]['typ.title']
                        }
                });        
            } else {
                res.render('main/indexTypo', { 
                    desk: { 
                        id: records[0]['d.id'],
                        type: records[0]['d.type'],
                        title: records[0]['d.title']
                        }
                });        
            }
        })   
        .catch(error => console.log(error))	
}; 

// Показать список всех досок
exports.deskList = function(req, res, next) {
    res.send('NOT IMPLEMENTED: Desk list');
}; 

