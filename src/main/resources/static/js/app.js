(function() {
	bind();
//	$("#upload").trigger("click");
	$("#run").trigger("click");
	
	function bind() {
		
		$("#run").on("click", function() {
			var config = {
				longTicker: "tqqq",
				shortTicker: "sqqq",
				startLength: 5,
				endLength: 250,
				dateInfo: {},
				momentumDataByLength: {},
				averageData: {},
				momentumResultDataByLength: {}
			}
			
			getTickerData()
				.then(function(tickerData) {
					config.tickerData = tickerData;
					var longDataList = tickerData[config.longTicker];
					var shortDataList = tickerData[config.shortTicker];
					var tempLongDataList = [];
					var tempShortDataList = [];
					
					var fiveYearlaterDate = moment(longDataList[0].date, "YYYYMMDD").add(5, 'year').format("YYYYMMDD");
					var idx = 0;
					while(idx < longDataList.length) {
						tempLongDataList.push(longDataList[idx]);
						tempShortDataList.push(shortDataList[idx]);
						
						if (longDataList[idx].date < fiveYearlaterDate) {
							idx++;
							continue;
						}
						
						config.longDataList = tempLongDataList;
						config.shortDataList = tempShortDataList;
						runHandler();
						console.log(idx);
						if (idx > 2000) debugger;
						idx++;
					}
				})
				.catch(function(e) {
					console.log(e.stack);
					alert("실행에 실패하였습니다.");
				})
			
			function runHandler() {
				calculate();
				initBestPosition();
			}
			
			function initBestPosition() {
				initBestMomentm();
				debugger
				while(maxLength <= config.endLength) {
					var momentumResultData = config.momentumResultDataByLength[maxLength];
					
					maxLength++;
				}
				config.momentumResultDataByLength
			}
			
			function calculate() {
				initDate();
				
				var maxLength = config.startLength
				while(maxLength <= config.endLength) {
					initMomentumDataByLength(maxLength);
					maxLength++;
				}
				
				maxLength = config.startLength
				while(maxLength <= config.endLength) {
					initMomentumResultDataByLength(maxLength);
					maxLength++;
				}
				
				initAverageChange();
			}
			
			function initMomentumResultDataByLength(maxLength) {
				var longDataList = config.longDataList;
				var shortDataList = config.shortDataList;
				var longTicker = config.longTicker;
				var shortTicker = config.shortTicker;
				var momentumData = config.momentumDataByLength[maxLength];
				var buyTickerData = {};
				var oneYearAgoResultList = [];
				var oneYearAgoDate = config.dateInfo.oneYearAgoDate;
				
				longDataList.forEach(function(longRow, idx) {
					var date = longRow.date;
					var successFlag = false;
					
					if (buyTickerData.buyFlag === true) {
						var shortRow = shortDataList[idx];
						
						if (buyTickerData.ticker === longTicker) {
							if (longRow.change > 0) {
								successFlag = true;
							}
						} else if (buyTickerData.ticker === shortTicker) {
							if (shortRow.change > 0) {
								successFlag = true;
							}
						}
						
						var result = {
							buyTicker: buyTickerData.ticker,
							successFlag: successFlag,
							row: {}
						}
						result.row[longTicker] = longRow;
						result.row[shortTicker] = shortRow;
						
						if (date >= oneYearAgoDate) {
							oneYearAgoResultList.push(result);
						}
						
						buyTickerData = {};
					}
					
					if (momentumData.hasOwnProperty(date) === false || isEmptyStr(momentumData[date]) === true) return;
					 
					buyTickerData = {
						buyFlag: true,
						ticker: momentumData[date]
					}
				})
				var momentumResultDataByLength = config.momentumResultDataByLength;
				momentumResultDataByLength[maxLength] = {};
				momentumResultDataByLength[maxLength].oneYearAgoResultList = oneYearAgoResultList;
			}
			
			function initAverageChange() {
				var oneYearAgoDate = config.dateInfo.oneYearAgoDate;
				var threeYearAgoDate = config.dateInfo.threeYearAgoDate;
				var fiveYearAgoDate = config.dateInfo.fiveYearAgoDate;
				var longDataList = config.longDataList;
				var dataListMaxlength = longDataList.length;
				var idx = 0;

				var averageData = {};
				averageData.all = {};
				averageData.oneYearAgo = {};
				averageData.threeYearAgo = {};
				averageData.fiveYearAgo = {};

				var allPlusList = [];
				var oneYearAgoPlusList = [];
				var threeYearAgoPlusList = [];
				var fiveYearAgoPlusList = [];
				var allMinusList = [];
				var oneYearAgoMinusList = [];
				var threeYearAgoMinusList = [];
				var fiveYearAgoMinusList = [];
				
				while(idx < dataListMaxlength) {
					var date = longDataList[idx].date;
					var change = longDataList[idx].change;
					
					if (change > 0) {
						allPlusList.push(change);
						
						if (date >= oneYearAgoDate) {
							oneYearAgoPlusList.push(change);
						}
						
						if (date >= threeYearAgoDate) {
							threeYearAgoPlusList.push(change);
						}
						
						if (date >= fiveYearAgoDate) {
							fiveYearAgoPlusList.push(change);
						}
					} else if (change < 0) {
						allMinusList.push(change);
						
						if (date >= oneYearAgoDate) {
							oneYearAgoMinusList.push(change);
						}
						
						if (date >= threeYearAgoDate) {
							threeYearAgoMinusList.push(change);
						}
						
						if (date >= fiveYearAgoDate) {
							fiveYearAgoMinusList.push(change);
						}
					}
					
					idx++;
				}
				
				averageData.all.plus = d3.mean(allPlusList);
				averageData.oneYearAgo.plus = d3.mean(oneYearAgoPlusList)
				averageData.threeYearAgo.plus = d3.mean(threeYearAgoPlusList)
				averageData.fiveYearAgo.plus = d3.mean(fiveYearAgoPlusList)
				averageData.all.minus = d3.mean(allMinusList)
				averageData.oneYearAgo.minus = d3.mean(oneYearAgoMinusList)
				averageData.threeYearAgo.minus = d3.mean(threeYearAgoMinusList)
				averageData.fiveYearAgo.minus = d3.mean(fiveYearAgoMinusList)
				
				config.averageData = averageData;
			} 
			
			function initDate() {
				var lastDate = config.longDataList[config.longDataList.length - 1].date;
				var oneYearAgoDate = moment(lastDate, "YYYYMMDD").subtract(1, 'year').format("YYYYMMDD");
				var threeYearAgoDate = moment(lastDate, "YYYYMMDD").subtract(3, 'year').format("YYYYMMDD");
				var fiveYearAgoDate = moment(lastDate, "YYYYMMDD").subtract(5, 'year').format("YYYYMMDD");
				
				config.dateInfo.lastDate = lastDate;
				config.dateInfo.oneYearAgoDate = oneYearAgoDate;
				config.dateInfo.threeYearAgoDate = threeYearAgoDate;
				config.dateInfo.fiveYearAgoDate = fiveYearAgoDate;
			}
			
			function initMomentumData(maxLength) {
				var lastChangeList = [];
				var momentumData = {};
				var longDataList = config.longDataList;
				
				longDataList.forEach(function(row) {
					lastChangeList.push(row.change);
					if (lastChangeList.length <= maxLength) return;
					lastChangeList.shift();
					
					var weight = maxLength;
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
						buyTicker = config.longTicker;
					} else if (sumMomentum < 0) {
						buyTicker = config.shortTicker;
					}
					
					momentumData[row.date] = buyTicker;
				})
				
				config.momentumDataByLength[maxLength] = momentumData;
			}
					
			function getTickerData() {
				return new Promise(function(resolve, reject) {
					$.ajax({
						type: "post",
						url: "/data/select",
						data: JSON.stringify({
							tickerList: JSON.stringify([config.longTicker, config.shortTicker])
						}),
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
