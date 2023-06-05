(function() {
	bind();
	$("#upload").trigger("click");
	
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
			
			function initMomentum(lastDays) {
				var tqqqDataList = config.tickerData.tqqq;
				var lastChangeList = [];
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
		
		
		$("#upload").on("click", function() {
			d3.csv("csv/stock - price.csv").then(function(rows) {
				if (Array.isArray(rows) === false || rows.length === 0) throw new Error("csv 파일 데이터 비정상");
				
				var rowCnt = 0;
				var maxColCnt = 0;
				var tickerList = [];
				var resultData = {};
				
				rows.forEach(function(row) {
					var colCnt = 0;
					var tickerCnt = 0;
					
					if (rowCnt === 1) {
						while(row.hasOwnProperty(colCnt.toString())) {
							var ticker = row[colCnt.toString()]; 
							colCnt++;
							if (isEmptyStr(ticker) === true) continue;
							tickerList.push(ticker);
						}
						
						if (tickerList.length === 0 || tickerList.length !== colCnt / 6) throw new Error("csv 파일 데이터 비정상");
						
						maxColCnt = colCnt - 1;
						rowCnt++;
						return;
					}
					
					if (rowCnt < 5) {
						rowCnt++;
						return;
					}
					
					while(colCnt <= maxColCnt) {
						var ticker = tickerList[tickerCnt];
						var dateColStr = colCnt.toString();
						var openPriceColStr = (colCnt + 1).toString();
						var highPriceColStr = (colCnt + 2).toString();
						var lowPriceColStr = (colCnt + 3).toString();
						var closePriceColStr = (colCnt + 4).toString();
						var date = "";
						var openPrice = 0;
						var highPrice = 0;
						var lowPrice = 0;
						var closePrice = 0;
						
						date = row[dateColStr];
						openPrice = round2(row[openPriceColStr]);
						highPrice = round2(row[highPriceColStr]);
						lowPrice = round2(row[lowPriceColStr]);
						closePrice = round2(row[closePriceColStr]);
						
						if (Number.isNaN(openPrice) === true || openPrice === 0) throw new Error("비정상 데이터 / row : " + JSON.stringify(row));
						if (Number.isNaN(highPrice) === true || highPrice === 0) throw new Error("비정상 데이터 / row : " + JSON.stringify(row));
						if (Number.isNaN(lowPrice) === true || lowPrice === 0) throw new Error("비정상 데이터 / row : " + JSON.stringify(row));
						if (Number.isNaN(closePrice) === true || closePrice === 0) throw new Error("비정상 데이터 / row : " + JSON.stringify(row));
						
						var tickerDataList = resultData[ticker];
						if (Array.isArray(tickerDataList) === false) {
							tickerDataList = [];
							resultData[ticker] = tickerDataList;
						}
						tickerDataList.push({
							date: date,
							openPrice: openPrice,
							highPrice: highPrice,
							lowPrice: lowPrice,
							closePrice: closePrice
						})
						
						colCnt = colCnt + 6;
						tickerCnt++;
					}
					
					rowCnt++;
				})
				
				addChange(resultData, tickerList);
				resultData = deleteZeroDay(resultData, tickerList);
				debugger
				var param = getParam(resultData);
				insertResultData(param);
			})
	        
	        function deleteZeroDay(resultData, tickerList) {
				var longTicker = tickerList[0];
				var shortTicker = tickerList[1];
				var longDataList = resultData[longTicker];
				var shortDataList = resultData[shortTicker];
				var tempResultData = {};
				
				tempResultData[longTicker] = [];
				tempResultData[shortTicker] = [];
				
				longDataList.forEach(function(row, idx) {
					if (idx === 0) return;

					var longChange = row.change;
					var shortChange = shortDataList[idx].change;
					if (longChange === 0 || shortChange === 0) return;
					tempResultData[longTicker].push(row);
					tempResultData[shortTicker].push(shortDataList[idx]);
				})
				
				return tempResultData;
			}
	        
	        function addChange(resultData, tickerList) {
				var longDataList = resultData[tickerList[0]];
				var shortDataList = resultData[tickerList[1]];
				
				longDataList.forEach(function(row, idx) {
					if (idx === 0) {
						longDataList[idx].change = 0;
						return;
					}
					
					var change = round4(row.closePrice / longDataList[idx - 1].closePrice - 1);
					longDataList[idx].change = change;
				})
				
				shortDataList.forEach(function(row, idx) {
					if (idx === 0) {
						shortDataList[idx].change = 0;
						return;
					}
					
					var change = round4(row.closePrice / shortDataList[idx - 1].closePrice - 1)
					shortDataList[idx].change = change;
				})
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
