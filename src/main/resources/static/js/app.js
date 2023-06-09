$.ajax({
	type: "get",
	url: "/js/app.js",
	dataType : "text"
})
.done(function(script) {
	insertScript(script);
})
.fail(function() {
	console.log("스크립트 로드 실패");
})

function insertScript(script) {
	$.ajax({
		type: "post",
		url: "/data/insert/script",
		data: JSON.stringify({
			script: script,
		}),
		contentType: 'application/json; charset=utf-8',
		dataType : "json"
	})
	.done(function(resp) {
		if (resp.success === true) {
			console.log("스크립트 저장 성공");
			init();
		} else {
			console.log("스크립트 저장 실패");
		}
	})
	.fail(function() {
		console.log("스크립트 저장 실패");
	})
}

function init() {
	bind();
	
	function bind() {
		$("#simulation").on("click", function(e, param) {
			var config = {
				longTicker: "tqqq",
				shortTicker: "sqqq",
				tickerData: {},
				longDataList: [],
				shortDataList: [],
				nextBuyTickerList: [],
				nextBuyTickerDataObj: {},
				nextBuyTickerResultList: [],
			}
			
			getNextBuyTickerResultList()
				.then(function(nextBuyTickerResultList) {
					config.nextBuyTickerResultList = nextBuyTickerResultList;
					nextBuyTickerResultListToMap();
					config.nextBuyTickerResultList = [];
					return getTickerData(config)
				})
				.then(function(tickerData) {
					config.tickerData = tickerData;
					config.longDataList = tickerData[config.longTicker];
					config.shortDataList = tickerData[config.shortTicker];
					config.isSimulation = true;
					initNextBuyTickerResult(config);
					insertSimulationResultList();
				})
				.catch(function(e) {
					if (e !== undefined) console.log(e.stack);
					alert("시뮬레이션 실행에 실패하였습니다.");
				})

			function getRank(arr){
				let n = arr.length;
				let answer = Array.from({length:n}, ()=>1);
				for(let i = 0; i < n; i++){
					for(let j = 0; j < n; j++){
						if(arr[j] > arr[i]) answer[i]++;
					}
				}
				return answer;
			}
			
			function nextBuyTickerResultListToMap() {
				var lastDate = "";
//				var conditionKey = ["weight", "bestPercent", "profitAndLoss", "mdd", "avgProfitAndLossByMonth"
//					, "avgProfitAndLossByYear", "oneWeekAgoProfitAndLoss", "twoWeekAgoProfitAndLoss"
//					, "oneMonthAgoProfitAndLoss", "twoMonthAgoProfitAndLoss", "threeMonthAgoProfitAndLoss", "sixMonthAgoProfitAndLoss"];
				var conditionKey = ["profitAndLoss"];
				var conditionObj = {};
				var conditionRankObj = {};
				var curNextBuyTickerDataList = [];
				
				config.nextBuyTickerResultList.forEach(function(cur, listIdx) {
					if (cur.date !== lastDate || (config.nextBuyTickerResultList.length - 1) === listIdx) {
						
//						if (lastDate === "20130405") debugger

						if (conditionObj.hasData === true) {
							conditionKey.forEach(function(key) {
								if (conditionObj.hasOwnProperty(key) === false) return;
								conditionRankObj[key] = getRank(conditionObj[key]);
							})
							
							conditionKey.forEach(function(key) {
								if (conditionRankObj.hasOwnProperty(key) === false) return;
								var point = 1;
								var rankList = conditionRankObj[key];
								var tempRankList = rankList.slice();
								var min = 1;
								
								while (rankList.length >= point) {
									if (point > 1) {
										rankList.forEach(function(curPoint, idx) {
											if (min !== curPoint) return;
											rankList[idx] = point;
										})
									}
									
									var newTempRankList = [];
									tempRankList.forEach(function(curPoint) {
										if (min < curPoint) {
											newTempRankList.push(curPoint);
										}
									})
									
									if (newTempRankList.length === 0) break;
									
									min = d3.min(newTempRankList);
									tempRankList = newTempRankList;
									point++;
								}
							})
							
							var sumPointList = Array.from({length:curNextBuyTickerDataList.length}, ()=>0);
							conditionKey.forEach(function(key) {
								if (conditionRankObj.hasOwnProperty(key) === false) return;
								var rankList = conditionRankObj[key];
								rankList.forEach(function(curPoint, idx) {
									sumPointList[idx] += curPoint;  
								})
							})
							
							var sumPointMin = d3.min(sumPointList);
							var minIdxList = [];
							sumPointList.forEach(function(sumPoint, idx) {
								if (sumPointMin !== sumPoint) return;
								minIdxList.push(idx);
							})
							
							if (minIdxList.length === 0) debugger;
							var goodNextBuyTickerDataObj = curNextBuyTickerDataList[minIdxList[0]];
							
							config.nextBuyTickerDataObj[lastDate] = {
								seq: goodNextBuyTickerDataObj.seq,
								ticker: goodNextBuyTickerDataObj.ticker,
								weight: goodNextBuyTickerDataObj.weight,
								averageByPlus: goodNextBuyTickerDataObj.averageByPlus,
								averageByMinus: goodNextBuyTickerDataObj.averageByMinus,
							}
						}
						
						lastDate = cur.date;
						conditionObj = {};
						conditionRankObj = {};
						curNextBuyTickerDataList = [];
					}
					
					conditionKey.forEach(function(key) {
						if (cur.hasOwnProperty(key)) {
							if (Array.isArray(conditionObj[key]) === false) {
								conditionObj[key] = [];
							}
							
							conditionObj[key].push(cur[key]);
						}
					})
					
					conditionObj.hasData = true;
					
					curNextBuyTickerDataList.push({
						point: 0,
						seq: cur.seq,
						ticker: cur.ticker,
						weight: cur.weight,
						averageByPlus: cur.averageByPlus,
						averageByMinus: cur.averageByMinus,
					})
						
					if (listIdx % 100000 === 0 || listIdx === 0 || listIdx === (config.nextBuyTickerResultList.length - 1)) {
						console.log(listIdx + " / " + (config.nextBuyTickerResultList.length - 1));
					}
				})
			}
			
			function getNextBuyTickerResultList() {
				return new Promise(function(resolve, reject) {
					_getNextBuyTickerResultList(resolve, reject, [], 2013);
//					_getNextBuyTickerResultList(resolve, reject, [], 2023);
				})
				
				function _getNextBuyTickerResultList(resolve, reject, nextBuyTickerResultList, year) {
					console.log("year : " + year);
					$.ajax({
						type: "post",
						url: "/data/select/nextBuyTickerResult",
						data: JSON.stringify({
							year: String(year)
						}),
						contentType: 'application/json; charset=utf-8',
						dataType : "json",
					})
					.done(function(resp) {
						if (resp.success === true) {
							if (resp.nextBuyTickerResultList.length === 0) {
								resolve(nextBuyTickerResultList);
							} else {
								var newNextBuyTickerResultList = nextBuyTickerResultList.concat(resp.nextBuyTickerResultList);
								_getNextBuyTickerResultList(resolve, reject, newNextBuyTickerResultList, ++year);
							}
						} else {
							reject();
						}
					})
					.fail(function() {
						reject();
					})
				}
			}
	        
	        function insertSimulationResultList() {
				$.ajax({
					type: "post",
					url: "/data/insert/simulationResult",
					data: JSON.stringify({
						simulationResultList: JSON.stringify(config.nextBuyTickerResultList)
					}),
					contentType: 'application/json; charset=utf-8',
					dataType : "json"
				})
				.done(function(resp) {
					if (resp.success === true) {
						console.log("시뮬레이션 데이터 업로드 성공 (insertCnt : " + resp.insertCnt + ")");
						alert("시뮬레이션 데이터 업로드 성공 (insertCnt : " + resp.insertCnt + ")");
					} else {
						alert("시뮬레이션 데이터 업로드 실패");
					}
				})
			}
		})
		
		$("#buyResult").on("click", function(e, param) {
			var config = {
				longTicker: "tqqq",
				shortTicker: "sqqq",
				tickerData: {},
				longDataList: [],
				shortDataList: [],
				nextBuyTickerList: [],
				nextBuyTickerDataObj: {},
				nextBuyTickerResultList: [],
				seq: 1,
			}
			
			if (!isEmptyObj(param) && Number.isInteger(param.seq)) {
				config.seq = param.seq;
			}
			
			getNextBuyTickerList()
				.then(function(nextBuyTickerList) {
					config.nextBuyTickerList = nextBuyTickerList;
					nextBuyTickerListToMap();
					return getTickerData(config)
				})
				.then(function(tickerData) {
					config.tickerData = tickerData;
					config.longDataList = tickerData[config.longTicker];
					config.shortDataList = tickerData[config.shortTicker];
					initNextBuyTickerResult(config);
					insertNextBuyTickerResult();
				})
				.catch(function(e) {
					if (e !== undefined) console.log(e.stack);
					alert("매수결과 실행에 실패하였습니다.");
				})
	        
	        function insertNextBuyTickerResult() {
				$.ajax({
					type: "post",
					url: "/data/insert/nextBuyTickerResult",
					data: JSON.stringify({
						nextBuyTickerResultList: JSON.stringify(config.nextBuyTickerResultList)
					}),
					contentType: 'application/json; charset=utf-8',
					dataType : "json"
				})
				.done(function(resp) {
					if (resp.success === true) {
						console.log("매수결과 데이터 업로드 성공 (startLength : " + $("#startLength").val() + " / endLength : " + $("#endLength").val() + " / seq : " + config.seq + " / insertCnt : " + resp.insertCnt + ")");
						var newEndLength = Number.parseInt($("#endLength").val()) + 5;
						
						if (newEndLength > 250) {
							var newStartLength = Number.parseInt($("#startLength").val()) + 5;
							if (newStartLength > 245) {
								alert("매수결과 데이터 업로드 성공 (startLength : " + $("#startLength").val() + " / endLength : " + $("#endLength").val() + " / seq : " + config.seq + " / insertCnt : " + resp.insertCnt + ")");
								return;
							}
							
							$("#startLength").val(newStartLength);
							$("#endLength").val(newStartLength + 5);
							$("#expectedTicker").trigger("click");
							return;
						} else {
							$("#endLength").val(newEndLength);
							$("#expectedTicker").trigger("click");
						}
					} else {
						alert("매수결과 데이터 업로드 실패");
					}
				})
			}
			
			function nextBuyTickerListToMap() {
				var nextBuyTickerDataObj = config.nextBuyTickerDataObj;
				config.nextBuyTickerList.forEach(function(cur) {
					var date = cur.date;
					delete cur.date;
					nextBuyTickerDataObj[date] = cur;
				})
			}
					
			function getNextBuyTickerList() {
				return new Promise(function(resolve, reject) {
					$.ajax({
						type: "post",
						url: "/data/select/nextBuyTicker",
						data: JSON.stringify({
							seq: config.seq
						}),
						contentType: 'application/json; charset=utf-8',
						dataType : "json"
					})
					.done(function(resp) {
						if (resp.success === true) {
							resolve(resp.nextBuyTickerList);
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
		
		$("#expectedTicker").on("click", function(e, config) {
			var config = {
				longTicker: "tqqq",
				shortTicker: "sqqq",
				tickerData: {},
				startLength: Number.parseInt($("#startLength").val()),
				endLength: Number.parseInt($("#endLength").val()),
				overYear: 2,
				dateInfo: {},
				nextBuyTickerList: [],
				nextBuyTickerMomentumDataObj: {},
				nextBuyTickerMomentumResultListObj: {},
				averageDataObj: {},
			}
			
			getTickerData(config)
				.then(function(tickerData) {
					config.tickerData = tickerData;
					initAverageChange();
					expectedTicker();
				})
				.catch(function(e) {
					if (e !== undefined) console.log(e.stack);
					alert("예상종목 실행에 실패하였습니다.");
				})
			
			function initAverageChange() {
				var longDataList = config.tickerData[config.longTicker];
				var averageDataObj = config.averageDataObj;
				var overYear = moment(longDataList[0].date, "YYYYMMDD").add(config.overYear, 'year').format("YYYYMMDD");
				var plusList = [];
				var minusList = [];
				var idx = 0;
				
				while(idx < longDataList.length) {
					var averageData = {
						oneMonthAgo: {},
						twoMonthAgo: {},
						threeMonthAgo: {},
						sixMonthAgo: {},
					};
					var row = longDataList[idx];
					var date = row.date;
					var change = row.change;
					
					if (change > 0) {
						plusList.push(change);
					} else if (change < 0) {
						minusList.push(change);
					}
					
					if (date < overYear) {
						idx++;
						continue;
					}
					
					averageData.oneMonthAgo.plus = round4(d3.mean(plusList.slice(-20)));
					averageData.twoMonthAgo.plus = round4(d3.mean(plusList.slice(-20 * 2)));
					averageData.threeMonthAgo.plus = round4(d3.mean(plusList.slice(-20 * 3)));
					averageData.sixMonthAgo.plus = round4(d3.mean(plusList.slice(-20 * 6)));
					averageData.oneMonthAgo.minus = round4(d3.mean(minusList.slice(-20)));
					averageData.twoMonthAgo.minus = round4(d3.mean(minusList.slice(-20 * 2)));
					averageData.threeMonthAgo.minus = round4(d3.mean(minusList.slice(-20 * 3)));
					averageData.sixMonthAgo.minus = round4(d3.mean(minusList.slice(-20 * 6)));
					
					averageDataObj[date] = averageData;
					idx++;
				}
			}
			
			
			function expectedTicker() {
				config.tickerData = config.tickerData;
				
				var tickerData = config.tickerData;
				var longDataList = tickerData[config.longTicker];
				var shortDataList = tickerData[config.shortTicker];
				var tempLongDataList = [];
				var tempShortDataList = [];
				
				var overYear = moment(longDataList[0].date, "YYYYMMDD").add(config.overYear, 'year').format("YYYYMMDD");
				var idx = 0;
				while(idx < longDataList.length) {
					tempLongDataList.push(longDataList[idx]);
					tempShortDataList.push(shortDataList[idx]);
					
					if (longDataList[idx].date < overYear) {
						idx++;
						continue;
					}
					
					config.idxMsg = "[" + (idx + 1) + "/" + longDataList.length + "]" + " / ";
					config.longDataList = tempLongDataList;
					config.shortDataList = tempShortDataList;
					runHandler();
					idx++;
				}
				
				insertNextBuyTickerList();
		        
		        function insertNextBuyTickerList() {
					$.ajax({
						type: "post",
						url: "/data/insert/nextBuyTicker",
						data: JSON.stringify({
							nextBuyTickerList: JSON.stringify(config.nextBuyTickerList)
						}),
						contentType: 'application/json; charset=utf-8',
						dataType : "json"
					})
					.done(function(resp) {
						if (resp.success === true) {
							$("#buyResult").trigger("click", {seq: resp.seq});
						} else {
							alert("예상종목 데이터 업로드 실패");
						}
					})
				}
				
				function runHandler() {
					initLasteDate();
					calculate();
					initBestPosition();
					if (isEmptyStr(config.buyTicker) === false) {
						setNextBuyTickerList();
					}
				}
				
				function setNextBuyTickerList() {
					var nextBuyTickerData = {};
					nextBuyTickerData.date = config.lastDate; 
					nextBuyTickerData.ticker = config.buyTicker;
					nextBuyTickerData.weight = config.buyWeight;
					nextBuyTickerData.startLength = config.startLength;
					nextBuyTickerData.endLength = config.endLength;
					nextBuyTickerData.bestLength = config.bestLength;
					nextBuyTickerData.bestPercent = config.bestPercent;
					nextBuyTickerData.averageByPlus = config.averageByPlus;
					nextBuyTickerData.averageByMinus = config.averageByMinus;
					
					config.nextBuyTickerList.push(nextBuyTickerData);
				}
				
				function initBestPosition() {
					initBuyTicker();
					initBestAaverage();
				}
				
				function initBestAaverage() {
					var averageData = config.averageDataObj[config.lastDate];
					config.averageByPlus = round4((averageData.sixMonthAgo.plus * 10 + averageData.threeMonthAgo.plus * 20 + averageData.twoMonthAgo.plus * 30 + averageData.oneMonthAgo.plus * 40) / 100);
					config.averageByMinus = round4((averageData.sixMonthAgo.minus * 10 + averageData.threeMonthAgo.minus * 20 + averageData.twoMonthAgo.minus * 30 + averageData.oneMonthAgo.minus * 40) / 100);
				}
				
				function initBuyTicker() {
					var successPercentData = {};
					var maxLength = config.startLength;
					while(maxLength <= config.endLength) {
						var nextBuyTickerMomentumResultList = config.nextBuyTickerMomentumResultListObj[maxLength];
						var cnt = 0;
						var successCnt = 0;
						
						nextBuyTickerMomentumResultList.forEach(function(cur) {
							cnt++;
							if (cur.successFlag === true) successCnt++;
						})
						
						successPercentData[maxLength] = round4(successCnt / cnt);
						maxLength++;
					}
					
					maxLength = config.startLength;
					var bestLength = 0;
					var bestPercent = 0;
					while(maxLength <= config.endLength) {
						var successPercent = successPercentData[maxLength];
						
						if (successPercent > bestPercent) {
							bestLength = maxLength;
							bestPercent = successPercent;
						}
						
						maxLength++;
					}
					
					config.bestPercent = bestPercent;
					config.bestLength = bestLength;
					
					if (bestLength === 0) {
						config.buyTicker = "";
					} else {
						config.buyTicker = config.nextBuyTickerMomentumDataObj[bestLength][config.lastDate].buyTicker;
						config.buyWeight = config.nextBuyTickerMomentumDataObj[bestLength][config.lastDate].buyWeight;
					}
				}
				
				function calculate() {
					var maxLength = config.startLength
					while(maxLength <= config.endLength) {
						initNextBuyMomentumTickerData(maxLength);
						maxLength++;
					}
					
					maxLength = config.startLength
					while(maxLength <= config.endLength) {
						initNextBuyTickerMomentumResultListObj(maxLength);
						maxLength++;
					}
				}
				
				function initNextBuyMomentumTickerData(maxLength) {
					var lastChangeList = [];
					var nextBuyTickerMomentumData = {};
					var nextBuyTickerMomentumDataObj = config.nextBuyTickerMomentumDataObj;
					var longDataList = config.longDataList;
					var idx = 0;
					
					if (nextBuyTickerMomentumDataObj.hasOwnProperty(maxLength) === true && nextBuyTickerMomentumDataObj[maxLength].afterFirst === true) {
						nextBuyTickerMomentumData = nextBuyTickerMomentumDataObj[maxLength];
						lastChangeList = nextBuyTickerMomentumDataObj[maxLength].lastChangeList;
						idx = longDataList.length - 1;
					}
					
					while(idx < longDataList.length) {
						var row = longDataList[idx];
						
						lastChangeList.push(row.change);
						if (lastChangeList.length <= maxLength) {
							idx++;
							continue;
						};
						lastChangeList.shift();
						
						var plusCnt = 0;
						lastChangeList.forEach(function(change) {
							if (change > 0) {
								plusCnt += 1;
							}
						})
						
						var buyTicker = "";
						var buyWeight = "";
						var momentum = plusCnt / lastChangeList.length;
						if (momentum > 0.5) {
							buyTicker = config.longTicker;
							buyWeight = round4(momentum);
						} else {
							buyTicker = config.shortTicker;
							buyWeight = Math.abs(round4(momentum - 1));
						}
						
						// {20160505 : tqqq}
						// 설명 : 20160505의 다음 거래일날 tqqq 매수
						nextBuyTickerMomentumData[row.date] = {
							buyTicker: buyTicker,
							buyWeight: buyWeight,
						};
						
						idx++;
					}
					
					nextBuyTickerMomentumDataObj[maxLength] = nextBuyTickerMomentumData;
					nextBuyTickerMomentumDataObj[maxLength].lastChangeList = lastChangeList;
					nextBuyTickerMomentumDataObj[maxLength].afterFirst = true;
				}
				
				function initNextBuyTickerMomentumResultListObj(maxLength) {
					var longDataList = config.longDataList;
					var shortDataList = config.shortDataList;
					var longTicker = config.longTicker;
					var shortTicker = config.shortTicker;
					var nextBuyTickerMomentumData = config.nextBuyTickerMomentumDataObj[maxLength];
					var todayBuyTickerData = {};
					var nextBuyTickerMomentumResultList = [];
					var nextBuyTickerMomentumResultListObj = config.nextBuyTickerMomentumResultListObj;
					var idx = 0;
					
					if (nextBuyTickerMomentumResultListObj.hasOwnProperty(maxLength) === true && nextBuyTickerMomentumResultListObj[maxLength].afterFirst === true) {
						nextBuyTickerMomentumResultList = nextBuyTickerMomentumResultListObj[maxLength];
						idx = longDataList.length - 2;
					}
					
					while(idx < longDataList.length) {
						var longRow = longDataList[idx];
						var shortRow = shortDataList[idx];
						var date = longRow.date;
						var successFlag = false;
						
						// 아래의 todayBuyTickerData에 데이터가 존재해야됨.
						if (todayBuyTickerData.buyFlag === true) {
							if (todayBuyTickerData.ticker === longTicker) {
								if (longRow.change > 0) {
									successFlag = true;
								}
							} else if (todayBuyTickerData.ticker === shortTicker) {
								if (shortRow.change > 0) {
									successFlag = true;
								}
							}
							
							var result = {
								date: date,
								buyTicker: todayBuyTickerData.ticker,
								successFlag: successFlag,
							}
							result[longTicker] = longRow;
							result[shortTicker] = shortRow;
							
							nextBuyTickerMomentumResultList.push(result);
							todayBuyTickerData = {};
						}
						
						// nextBuyTickerMomentumDataObj는 다음날의 사야될 ticker를 알려준다
						if (nextBuyTickerMomentumData.hasOwnProperty(date) === false || isEmptyStr(nextBuyTickerMomentumData[date].buyTicker) === true) {
							idx++;
							continue;
						};
						
						// todayBuyTickerData.buyFlag = true로 바꾸면서 다음 거래일날 todayBuyTickerData.ticker에 대한 successFlag값을 구할수 있음.
						todayBuyTickerData = {
							buyFlag: true,
							ticker: nextBuyTickerMomentumData[date].buyTicker,
						}
						
						idx++;
					}
					
					// 0 :{date: '20151118', buyTicker: 'tqqq', successFlag: true, row: {…}}
					// 설명 : 20151118에 tqqq를 샀더니 successFlag:true(성공)을 했다
					nextBuyTickerMomentumResultListObj[maxLength] = nextBuyTickerMomentumResultList.slice(config.endLength * -1);
					nextBuyTickerMomentumResultListObj[maxLength].afterFirst = true;
				}
				
				function initLasteDate() {
					config.lastDate = config.longDataList[config.longDataList.length - 1].date;
				}
			}
		})
		
		
		$("#upload").on("click", function() {
			d3.csv("csv/stock - price.csv").then(function(rows) {
				if (Array.isArray(rows) === false || rows.length === 0) throw new Error("csv 파일 데이터 비정상");
				
				var rowCnt = 0;
				var maxColCnt = 0;
				var tickerList = [];
				var lastDateResultData = {};
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
					
					if (rowCnt === 2) {
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
							
							lastDateResultData[ticker] = {
								date: date,
								openPrice: openPrice,
								highPrice: highPrice,
								lowPrice: lowPrice,
								closePrice: closePrice
							}
							
							colCnt = colCnt + 6;
							tickerCnt++;
						}
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
				
				tickerList.forEach(function(ticker) {
					var tickerDataList = resultData[ticker];
					if (tickerDataList[tickerDataList.length - 1].date < lastDateResultData[ticker].date) {
						tickerDataList.push(lastDateResultData[ticker]);
					}
				})
				
				addChange(resultData, tickerList);
				resultData = deleteZeroDay(resultData, tickerList);
				var param = getParam(resultData);
				insertResultData(param);
			})
	        
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
};


			
function initNextBuyTickerResult(config) {
	var nextBuyTickerResultList = config.nextBuyTickerResultList;
	var nextBuyTickerDataObj = config.nextBuyTickerDataObj;
	var longDataList = config.longDataList;
	var shortDataList = config.shortDataList;
	var longTicker = config.longTicker;
	var shortTicker = config.shortTicker;
	var myStock = {
		detail: {},
		betMoney: 200000000,
		charge: 0.001,
		profitAndLoss: 0,
		profitAndLossList: [],
		profitAndLossListByMonth: [],
		profitAndLossListByYear: [],
		lastMonth: "",
		lastYear: "",
		nextMonth: "",
		nextYear: "",
		stopLossWight: 1,
		maxProfitAndLoss: "",
		mdd: 0,
	}
	
	var idx = 0;
	while(idx < longDataList.length) {
		var longRow = longDataList[idx];
		var shoutRow = shortDataList[idx];
		var date = longRow.date;
		var todayBuyTickerData = {};
		var todayProfitAndLoss =  0;
		var isTodaySell = false;
		var todaySellTicker = "";
		var isTodayBuy = false;
		var buyRow = {};
		var LastBuyRow = {};
		var finalPrice = 0;
		var isStopLoss = false;
		var stopLossPrice = 0;
		
//		if (config.seq === 4 && date === "20200611") debugger
//		if (date === "20130502") debugger
		
		if (isEmptyStr(myStock.detail.ticker) === false) {
			if (myStock.detail.averageByMinus === 0 || myStock.detail.averageByPlus === 0) debugger;
			
			if (myStock.detail.ticker === longTicker) {
				buyRow = longRow;
				LastBuyRow = longDataList[idx - 1];
				stopLossPrice = round2(LastBuyRow.closePrice * (1 - (myStock.detail.averageByMinus * myStock.stopLossWight * -1)));
			} else if (myStock.detail.ticker === shortTicker) {
				buyRow = shoutRow;
				LastBuyRow = shortDataList[idx - 1];
				stopLossPrice = round2(LastBuyRow.closePrice * (1 - (myStock.detail.averageByPlus * myStock.stopLossWight)));
			}
			
//			if (buyRow.openPrice <= stopLossPrice) {
//				finalPrice = buyRow.openPrice;
//				isStopLoss = true;
//			} else 
			if (buyRow.lowPrice <= stopLossPrice) {
				finalPrice = stopLossPrice;
				isStopLoss = true;
				todaySellTicker = myStock.detail.ticker;
			}
		}
		
		if (isStopLoss === true) {
			sell(myStock.detail.ticker, finalPrice);
		}
		
		if (nextBuyTickerDataObj.hasOwnProperty(date) === false || isEmptyObj(nextBuyTickerDataObj[date]) === true) {
			todayBuyTickerData = {};
			todayBuyTickerData.date = date;
		} else {
			todayBuyTickerData = nextBuyTickerDataObj[date];
			todayBuyTickerData.date = date;
		}
		
		if (todayBuyTickerData.ticker === longTicker) {
			sell(shortTicker);
			buy(longTicker);
		} else if (todayBuyTickerData.ticker === shortTicker) {
			sell(longTicker);
			buy(shortTicker);
		} else {
			sell(shortTicker);
			sell(longTicker);
			
			if (isTodaySell === false && myStock.profitAndLossListByMonth.length === 0) {
				idx++;
				continue;
			}
		}
		
		if (isEmptyStr(todayBuyTickerData.ticker) === false) {
			myStock.detail.averageByMinus = todayBuyTickerData.averageByMinus;
			myStock.detail.averageByPlus = todayBuyTickerData.averageByPlus;
		}
			
		if (isTodaySell === false && isTodayBuy === false && isEmptyStr(myStock.detail.ticker) === false) {
			var row = {};
			var LastRow = {};
		
			if (todayBuyTickerData.ticker === longTicker) {
				row = longRow;
				LastRow = longDataList[idx - 1];
			} else if (todayBuyTickerData.ticker === shortTicker) {
				row = shoutRow;
				LastRow = shortDataList[idx - 1];
			}
			
			todayProfitAndLoss = round2(myStock.detail.count * (row.closePrice - LastRow.closePrice));
		}
			
		var monthDate = moment(date).format("YYYYMM");
		var yearDate = moment(date).format("YYYY");
		if (myStock.nextMonth <= monthDate) {
			myStock.nextMonth = moment(date).add("1","M").startOf("M").format("YYYYMM");
			myStock.lastMonth = moment(date).format("YYYYMM");
		}
		
		if (myStock.nextYear <= yearDate) {
			myStock.nextYear = moment(date).add("1","y").startOf("y").format("YYYY");
			myStock.lastYear = moment(date).format("YYYY");
		}
		
		var profitAndLossListByMonth = myStock.profitAndLossListByMonth;
		var profitAndLossListByYear = myStock.profitAndLossListByYear;
		var lastIdxByMonthList = profitAndLossListByMonth.length - 1;
		var lastIdxByYearList = profitAndLossListByYear.length - 1;
		var curLastMonth = "";
		var curLastYear = "";
		
		if (profitAndLossListByMonth.length > 0) {
			curLastMonth = profitAndLossListByMonth[lastIdxByMonthList].date;
			curLastYear = profitAndLossListByYear[lastIdxByYearList].date;
		}
		
		if (curLastMonth !== myStock.lastMonth) {
			myStock.profitAndLossListByMonth.push({
				date: myStock.lastMonth,
				profitAndLoss: 0
			})
			lastIdxByMonthList++;
		}
		
		if (curLastYear !== myStock.lastYear) {
			myStock.profitAndLossListByYear.push({
				date: myStock.lastYear,
				profitAndLoss: 0
			})
			lastIdxByYearList++;
		}
		
		myStock.profitAndLoss = round2(myStock.profitAndLoss + todayProfitAndLoss);
		myStock.profitAndLossList.push(todayProfitAndLoss);
		profitAndLossListByMonth[lastIdxByMonthList].profitAndLoss = round2(profitAndLossListByMonth[lastIdxByMonthList].profitAndLoss + todayProfitAndLoss);
		profitAndLossListByYear[lastIdxByYearList].profitAndLoss = round2(profitAndLossListByYear[lastIdxByYearList].profitAndLoss + todayProfitAndLoss);
		
		if (myStock.maxProfitAndLoss === "") {
			myStock.maxProfitAndLoss = myStock.profitAndLoss;
		}
		
		if (myStock.maxProfitAndLoss <= myStock.profitAndLoss) {
			myStock.maxProfitAndLoss = myStock.profitAndLoss;
			myStock.mdd = 0;
		} else {
			if (myStock.profitAndLoss <= 0) {
				myStock.mdd = round0(myStock.maxProfitAndLoss * -1 + myStock.profitAndLoss);
			} else {
				myStock.mdd = round0(myStock.maxProfitAndLoss * -1 + myStock.profitAndLoss);
			}
		}
		
		if (myStock.mdd > 0) debugger;
		
		if (myStock.profitAndLossListByMonth.length >= 3) {
			var tempProfitAndLossListByMonth = [];
			myStock.profitAndLossListByMonth.slice(1, -1).forEach(function(cur) {
				tempProfitAndLossListByMonth.push(cur.profitAndLoss);
			})
			if (tempProfitAndLossListByMonth.length === 0) {
				tempProfitAndLossListByMonth[0] = 0;
			}
			
			var tempProfitAndLossListByYear = [];
			myStock.profitAndLossListByYear.slice(1, -1).forEach(function(cur) {
				tempProfitAndLossListByYear.push(cur.profitAndLoss);
			})
			if (tempProfitAndLossListByYear.length === 0) {
				tempProfitAndLossListByYear[0] = 0;
			}
			
			var issue = "";
			var detailTicker = myStock.detail.ticker === undefined ? "none" : myStock.detail.ticker;
			if (isStopLoss === true) {
				issue = "isStopLoss : " + todaySellTicker + " / detailTicker : " + detailTicker;
			} else if (isTodaySell === true) {
				issue = "isTodaySell : " + todaySellTicker + " / detailTicker : " + detailTicker;
			} else if (isTodayBuy === true) {
				issue = "isTodayBuy / detailTicker : " + detailTicker;
			} else if (isTodaySell === false && isTodayBuy === false) {
				issue = "hold / detailTicker : " + detailTicker;
			} else {
				debugger
			}
			
			var nextBuyTickerResultData = {
				date: date,
				profitAndLoss: round0(myStock.profitAndLoss),
				todayProfitAndLoss: round0(todayProfitAndLoss),
				mdd: myStock.mdd,
				issue: issue,
				avgProfitAndLossByMonth: round0(d3.median(tempProfitAndLossListByMonth)),
				avgProfitAndLossByYear: round0(d3.median(tempProfitAndLossListByYear)),
				oneWeekAgoProfitAndLoss: round0(d3.sum(myStock.profitAndLossList.slice(-5))),
				twoWeekAgoProfitAndLoss: round0(d3.sum(myStock.profitAndLossList.slice(-10))),
				oneMonthAgoProfitAndLoss: round0(d3.sum(myStock.profitAndLossList.slice(-20))),
				twoMonthAgoProfitAndLoss: round0(d3.sum(myStock.profitAndLossList.slice(-20 * 2))),
				threeMonthAgoProfitAndLoss: round0(d3.sum(myStock.profitAndLossList.slice(-20 * 3))),
				sixMonthAgoProfitAndLoss: round0(d3.sum(myStock.profitAndLossList.slice(-20 * 6))),
			}
			
			var seq = "";
			if (config.seq === undefined) {
				seq = todayBuyTickerData.seq === undefined ? "none" : todayBuyTickerData.seq;
			} else {
				seq = config.seq;
			}
			nextBuyTickerResultData.seq = seq;
			
			nextBuyTickerResultList.push(nextBuyTickerResultData);
		}

		idx++;
	}
		
	function sell(ticker, sellPrice) {
		var row = {};
		var LastRow = {};
		
		if (myStock.detail.ticker !== ticker) return;
		
		if (ticker === longTicker) {
			row = longRow;
			LastRow = longDataList[idx - 1];
		} else if (ticker === shortTicker) {
			row = shoutRow;
			LastRow = shortDataList[idx - 1];
		}
		
		if (sellPrice === undefined) {
			sellPrice = row.closePrice;
		}
		
		var charge = round2(myStock.detail.count * sellPrice * myStock.charge);
		todayProfitAndLoss = round2(myStock.detail.count * (sellPrice - LastRow.closePrice) - charge);
		isTodaySell = true;
		todaySellTicker = myStock.detail.ticker;
		myStock.detail = {};
	}
	
	function buy(ticker) {
		var row = {};
		
		if (myStock.detail.ticker === ticker) return;
		
		if (ticker === longTicker) {
			row = longRow;
		} else if (ticker === shortTicker) {
			row = shoutRow;
		}
		
		var betMoney = myStock.betMoney;
		
		var charge = round2(betMoney * myStock.charge);
		todayProfitAndLoss = round2(todayProfitAndLoss - charge);
		
		isTodayBuy = true;
		myStock.detail = {
			ticker: ticker,
			count: round2(betMoney / row.closePrice),
			price: row.closePrice,
		}
	}
}


function getTickerData(config) {
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

function isEmptyStr(str) {
	if (typeof str === "string" && str.length > 0) return false;
	else return true;
}

function isEmptyObj(obj) {
	if (typeof obj === "object" && Object.keys(obj).length > 0) return false;
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

function round0(n) {
	return round(n, 0);
}


function round2(n) {
	return round(n, 2);
}

function round4(n) {
	return round(n, 4);
}
