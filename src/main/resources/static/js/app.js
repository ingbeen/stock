(function() {
	bind();
	$("#run").trigger("click");
	
	function bind() {
		
		$("#run").on("click", function() {
			var config = {
				tickerList: ["tqqq", "sqqq"]
			}
			
			getTickerData()
				.then(function(tickerData) {
					config.tickerData = tickerData;
					var lastDays = 5;
					while(lastDays <= 250) {
						runHandler(lastDays);
						lastDays++;
					}
				})
				.catch(function(e) {
					console.log(e.stack);
					alert("실행에 실패하였습니다.");
				})
			
			function runHandler(lastDays) {
				initMomentum(lastDays);
				run();
				view(lastDays, "resultList");
//				view(lastDays, "oneYearAgoResultList");
//				view(lastDays, "threeYearAgoResultList");
//				view(lastDays, "fiveYearAgoResultList");
			}
			
			function view(lastDays, resultName) {
				var resultList = config[resultName];
				
				var cnt = 0;
				var successCnt = 0;
				resultList.forEach(function(row) {
//					console.log(JSON.stringify(row));
					cnt++;
					if (row.successFlag === true) successCnt++;
				})
				console.log(resultName + " / " + lastDays + " / " + round4(successCnt / cnt));
			}
			
			function run() {
				var tqqqDataList = config.tickerData.tqqq;
				var sqqqDataList = config.tickerData.sqqq;
				var momentumData = config.momentumData;
				var buyTickerData = {};
				var resultList = [];
				var oneYearAgoResultList = [];
				var threeYearAgoResultList = [];
				var fiveYearAgoResultList = [];
				var lastDate = tqqqDataList[tqqqDataList.length - 1].date;
				var oneYearAgoDate = moment(lastDate, "YYYYMMDD").subtract(1, 'year').format("YYYYMMDD");
				var threeYearAgoDate = moment(lastDate, "YYYYMMDD").subtract(3, 'year').format("YYYYMMDD");
				var fiveYearAgoDate = moment(lastDate, "YYYYMMDD").subtract(5, 'year').format("YYYYMMDD");
				
				tqqqDataList.forEach(function(tqqqRow, idx) {
					var date = tqqqRow.date;
					var successFlag = false;
					
					if (buyTickerData.buyFlag === true) {
						var sqqqRow = sqqqDataList[idx];
						
						if (buyTickerData.ticker === "tqqq") {
							if (tqqqRow.change > 0) {
								successFlag = true;
							}
						} else if (buyTickerData.ticker === "sqqq") {
							if (sqqqRow.change > 0) {
								successFlag = true;
							}
						}
						
						var result = {
							buyTicker: buyTickerData.ticker,
							row: {
								tqqq: tqqqRow,
								sqqq: sqqqRow
							},
							successFlag: successFlag
						}
						
						resultList.push(result)
						
						if (date >= oneYearAgoDate) {
							oneYearAgoResultList.push(result);
						}
						
						if (date >= threeYearAgoDate) {
							threeYearAgoResultList.push(result);
						}
						
						if (date >= fiveYearAgoDate) {
							fiveYearAgoResultList.push(result);
						}
						
						buyTickerData = {};
					}
					
					if (momentumData.hasOwnProperty(date) === false || isEmptyStr(momentumData[date]) === true) return;
					 
					buyTickerData = {
						buyFlag: true,
						ticker: momentumData[date]
					}
				})
				
				config.resultList = resultList;
				config.oneYearAgoResultList = oneYearAgoResultList;
				config.threeYearAgoResultList = threeYearAgoResultList;
				config.fiveYearAgoResultList = fiveYearAgoResultList;
			}
			
//			function initMomentum(lastDays) {
//				var tqqqDataList = config.tickerData.tqqq;
//				var lastChangeList = [];
////				var lastDays = lastDays;
//				var momentumData = {};
//				
//				tqqqDataList.forEach(function(tqqqRow) {
//					lastChangeList.push(tqqqRow.change);
//					if (lastChangeList.length <= lastDays) return;
//					lastChangeList.shift();
//					
//					var weight = 1;
//					var sumMomentum = 0;
//					lastChangeList.forEach(function(change) {
//						if (change > 0) {
//							sumMomentum += 1 * weight;
//						} else if (change < 0) {
//							sumMomentum -= 1 * weight;
//						}
//					})
//					
//					var buyTicker = "";
//					if (sumMomentum > 0) {
//						buyTicker = "tqqq";
//					} else if (sumMomentum < 0) {
//						buyTicker = "sqqq";
//					}
//					
//					momentumData[tqqqRow.date] = buyTicker;
//				})
//				
//				config.momentumData = momentumData;
//			}
			
			function initMomentum(lastDays) {
				var tqqqDataList = config.tickerData.tqqq;
				var lastChangeList = [];
//				var lastDays = 20;
				var momentumData = {};
				
				tqqqDataList.forEach(function(tqqqRow) {
					lastChangeList.push(tqqqRow.change);
					if (lastChangeList.length <= lastDays) return;
					lastChangeList.shift();
					
					var weight = lastDays;
					var sumMomentum = 0;
					lastChangeList.forEach(function(change) {
						if (change > 0) {
							sumMomentum += 1 * weight;
						} else if (change < 0) {
							sumMomentum -= 1 * weight;
						}
						weight--;
					})
					
					var buyTicker = "";
					if (sumMomentum > 0) {
						buyTicker = "tqqq";
					} else if (sumMomentum < 0) {
						buyTicker = "sqqq";
					}
					
					momentumData[tqqqRow.date] = buyTicker;
				})
				
				config.momentumData = momentumData;
			}
					
			function getTickerData() {
				return new Promise(function(resolve, reject) {
					$.ajax({
						type: "post",
						url: "/data/select",
						data: JSON.stringify({tickerList: JSON.stringify(config.tickerList)}),
						contentType: 'application/json; charset=utf-8',
						dataType : "json"
					})
					.done(function(resp) {
						if (resp.success === true) {
							resolve(resp.tickerData);
						} else {
							reject();
						}
					})
					.fail(function() {
						reject();
					})
				})
			}
		})
		
		
		$("#fileUpload").on("click", function() {
			d3.csv("csv/stock - price.csv").then(function(rows) {
				if (Array.isArray(rows) === false || rows.length === 0) throw new Error("csv 파일 데이터 비정상");
				
				var rowCnt = 0;
				var maxColCnt = 0;
				var tickerList = [];
				var resultData = {};
				
				rows.forEach(function(row) {
					var colCnt = 0;
					var tickerCnt = 0;
					
					if (rowCnt === 0) {
						while(row.hasOwnProperty(colCnt.toString())) {
							var ticker = row[colCnt.toString()]; 
							colCnt++;
							if (isEmptyStr(ticker) === true) continue;
							tickerList.push(ticker);
						}
						
						if (tickerList.length === 0 || tickerList.length !== colCnt / 2) throw new Error("csv 파일 데이터 비정상");
						
						maxColCnt = colCnt - 1;
						rowCnt++;
						return;
					}
					
					if (rowCnt < 5) {
						rowCnt++;
						return;
					}
					
					while(colCnt <= maxColCnt) {
						var dateColStr = colCnt.toString();
						var closeColStr = (colCnt + 1).toString();
						var date = "";
						var close = 0;
						
						date = row[dateColStr];
						close = round2(row[closeColStr]);
						
						if (Number.isNaN(close) === true || close === 0) throw new Error("비정상 데이터 / row : " + JSON.stringify(row));
						
						var tickerDataList = resultData[tickerList[tickerCnt]];
						if (Array.isArray(tickerDataList) === false) tickerDataList = [];
						tickerDataList.push({
							close_date: date,
							close_price: close
						})
						resultData[tickerList[tickerCnt]] = tickerDataList;
						
						colCnt = colCnt + 2;
						tickerCnt++;
					}
					
					rowCnt++;
				})
				
				addChange(resultData);
				var param = getParam(resultData);
				insertResultData(param);
			})
	        
	        function addChange(resultData) {
				Object.keys(resultData).forEach(function(ticker) {
					var tickerDataList = resultData[ticker];
					
					tickerDataList.forEach(function(cur, idx) {
						if (idx === 0) {
							tickerDataList[idx].close_change = 0;
							return;
						}
						
						var change = round4(cur.close_price / tickerDataList[idx - 1].close_price - 1)
						tickerDataList[idx].close_change = change;
					})
				})
				
				return resultData;
			}
	        
	        function getParam(resultData) {
				var param = {};
				
				Object.keys(resultData).forEach(function(ticker) {
					var tickerDataList = resultData[ticker];
					param[ticker] = JSON.stringify(tickerDataList);
				})
				
				return JSON.stringify(param);
			}
	        
	        function insertResultData(param) {
				$.ajax({
					type: "post",
					url: "/data/insert",
					data: param,
					contentType: 'application/json; charset=utf-8',
					dataType : "json"
				})
				.done(function(resp) {
					if (resp.success === true) {
						var msg = "";
						Object.keys(resp).forEach(function(key) {
							if (key === "success") return;
							if (msg.length !== 0) msg += " / ";
							msg += key + " : " + resp[key];
						}) 
						
						alert("데이터 업로드 성공 (" + msg + " )");
					} else {
						alert("데이터 업로드 실패");
					}
				})
			}
		})
	}
})();

function isEmptyStr(str) {
	if (typeof str === "string" && str.length > 0) return false;
	else return true;
}

function round(n, pos) {
	if (typeof n !== "number") n = Number(n);
	
	var digits = Math.pow(10, pos);
	
	var sign = 1;
	if (n < 0) {
		sign = -1;
	}
	
	n = n * sign;
	var num = Math.round(n * digits) / digits;
	num = num * sign;
	
	return Number(num.toFixed(pos));
}

function round2(n) {
	return round(n, 2);
}

function round4(n) {
	return round(n, 4);
}
