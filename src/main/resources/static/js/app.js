$.ajax({
	type: "get",
	url: "/js/app.js",
	dataType : "text"
})
.done(function(script) {
	init(script)
})
.fail(function() {
	console.log("스크립트 로드 실패")
})

function init(script) {
	bind();
//	$("#upload").trigger("click");
	$("#expectedTicker").trigger("click");
//	$("#expectedTicker_loop").trigger("click");
//	$("#buyResult_loop").trigger("click");
//	$("#simulation").trigger("click");
	
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
				})
				.catch(function(e) {
					if (e !== undefined) console.log(e.stack);
					alert("시뮬레이션 실행에 실패하였습니다.");
				})

			
			function nextBuyTickerResultListToMap() {
				var lastDate = "";
				var maxProfitAndLoss = 0;
				config.nextBuyTickerResultList.forEach(function(cur) {
					var sumProfitAndLoss = round2((cur.oneMonthAgoProfitAndLoss * 0 + cur.twoMonthAgoProfitAndLoss * 100 + cur.threeMonthAgoProfitAndLoss * 0 + cur.sixMonthAgoProfitAndLoss * 0) / 100);
					
					if (cur.date !== lastDate) {
						lastDate = cur.date;
						maxProfitAndLoss = sumProfitAndLoss;
					}
					
					if (maxProfitAndLoss <= sumProfitAndLoss) {
						maxProfitAndLoss = sumProfitAndLoss;
						config.nextBuyTickerDataObj[cur.date] = {
							ticker: cur.ticker,
							weight: cur.weight,
							averageByPlus: cur.averageByPlus,
							averageByMinus: cur.averageByMinus,
						}
					}
				})
			}
			
			function getNextBuyTickerResultList() {
				return new Promise(function(resolve, reject) {
					$.ajax({
						type: "get",
						url: "/data/select/nextBuyTickerResult",
						dataType : "json"
					})
					.done(function(resp) {
						if (resp.success === true) {
							resolve(resp.nextBuyTickerResultList);
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
		
		var buyResultConfig = {
			originConfigStr: "",
			loopCnt: 1,
			loopEndSeq: 246,
		}
		
		$("#buyResult_loop").on("click", function(e, param) {
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
			
			buyResultConfig.originConfigStr = JSON.stringify(config);
					
			// loop가 아닐경우 위 config와 다른점을 명시한다
			if (!isEmptyObj(param) && param.isLoop === false) {
				config.isLoop = false;
				config.seq = 1;
			}
			
			if (Number.isInteger(param.seq)) {
				config.seq = param.seq;
			}
			
			$("#buyResult_loop_sub").trigger("click", config);
		})
		
		$("#buyResult_loop_sub").on("click", function(e, config) {
			if (isEmptyObj(config)) {
				$("#buyResult_loop").trigger("click", {isLoop: false});
				return;
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
					if (config.isLoop === false) {
						if (resp.success === true) {
							console.log("매수결과 데이터 업로드 성공 (insertCnt : " + resp.insertCnt + ")");
							insertScript(config.seq, script);
						} else {
							alert("매수결과 데이터 업로드 실패");
						}
					} else {
						var originConfig = JSON.parse(buyResultConfig.originConfigStr);
						originConfig.seq = config.seq;
						originConfig.seq++;

						console.log("loopCnt : " + buyResultConfig.loopCnt + ", " + config.seq + "/" + buyResultConfig.loopEndSeq);
						if (buyResultConfig.loopEndSeq < originConfig.seq) {
							console.log("매수결과 데이터 업로드 성공 (loopCnt : " + buyResultConfig.loopCnt + ")");
						} else {
							buyResultConfig.loopCnt++;
							$("#buyResult_loop_sub").trigger("click", originConfig);
						}
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
		
		
		var expectedTickerConfig = {
			tickerData: {},
			originConfigStr: "",
			loopCnt: 1,
			loopEndLength: 250,
			nextBuyTickerMomentumDataObj: {},
			nextBuyTickerMomentumResultListObj: {},
			averageDataObj: {},
		}
		
		$("#expectedTicker_loop").on("click", function(e, param) {
			var config = {
				longTicker: "tqqq",
				shortTicker: "sqqq",
				tickerData: {},
				startLength: 5,
				endLength: 5,
				overYear: 2,
				dateInfo: {},
				nextBuyTickerList: [],
			}
			
			expectedTickerConfig.originConfigStr = JSON.stringify(config);
			
			getTickerData(config)
				.then(function(tickerData) {
					expectedTickerConfig.tickerData = tickerData;
					
					// loop가 아닐경우 위 config와 다른점을 명시한다
					if (!isEmptyObj(param) && param.isLoop === false) {
						config.isLoop = false;
						config.endLength = 80;
					}
					
					initAverageChange();
					$("#expectedTicker").trigger("click", config);
				})
				.catch(function(e) {
					if (e !== undefined) console.log(e.stack);
					alert("예상종목 실행에 실패하였습니다.");
				})
			
			function initAverageChange() {
				var longDataList = expectedTickerConfig.tickerData[config.longTicker];
				var averageDataObj = expectedTickerConfig.averageDataObj;
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
		})
		
		$("#expectedTicker").on("click", function(e, config) {
			if (isEmptyObj(config)) {
				$("#expectedTicker_loop").trigger("click", {isLoop: false});
				return;
			}
			
			config.tickerData = expectedTickerConfig.tickerData;
			
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
					if (config.isLoop === false) {
						if (resp.success === true) {
							console.log("예상종목 데이터 업로드 성공 (seq : " + resp.seq + " / insertCnt : " + resp.insertCnt + ")");
							$("#buyResult_loop").trigger("click", {seq: resp.seq, isLoop: false});
						} else {
							alert("예상종목 데이터 업로드 실패");
						}
					} else {
						var originConfig = JSON.parse(expectedTickerConfig.originConfigStr);
						originConfig.endLength = config.endLength;
						originConfig.endLength++;

						console.log("loopCnt : " + expectedTickerConfig.loopCnt + ", " + config.endLength + "/" + expectedTickerConfig.loopEndLength);
						if (expectedTickerConfig.loopEndLength < originConfig.endLength) {
							console.log("반복 예상종목 데이터 업로드 성공 (last seq : " + resp.seq + " / loopCnt : " + expectedTickerConfig.loopCnt + ")");
						} else {
							expectedTickerConfig.loopCnt++;
							$("#expectedTicker").trigger("click", originConfig);
						}
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
				nextBuyTickerData.endLength = config.endLength;
				nextBuyTickerData.bestLength = config.bestLength;
				nextBuyTickerData.bestPercent = config.bestPercent;
				nextBuyTickerData.averageByPlus = config.averageByPlus;
				nextBuyTickerData.averageByMinus = config.averageByMinus;
				
				config.nextBuyTickerList.push(nextBuyTickerData);
				if (config.isLoop === false) {
					console.log(config.idxMsg + JSON.stringify(nextBuyTickerData));
				}
			}
			
			function initBestPosition() {
				initBuyTicker();
				initBestAaverage();
			}
			
			function initBestAaverage() {
				var averageData = expectedTickerConfig.averageDataObj[config.lastDate];
				config.averageByPlus = round4((averageData.sixMonthAgo.plus * 10 + averageData.threeMonthAgo.plus * 20 + averageData.twoMonthAgo.plus * 30 + averageData.oneMonthAgo.plus * 40) / 100);
				config.averageByMinus = round4((averageData.sixMonthAgo.minus * 10 + averageData.threeMonthAgo.minus * 20 + averageData.twoMonthAgo.minus * 30 + averageData.oneMonthAgo.minus * 40) / 100);
			}
			
			function initBuyTicker() {
				var successPercentData = {};
				var maxLength = config.startLength;
				while(maxLength <= config.endLength) {
					var nextBuyTickerMomentumResultList = expectedTickerConfig.nextBuyTickerMomentumResultListObj[maxLength];
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
					config.buyTicker = expectedTickerConfig.nextBuyTickerMomentumDataObj[bestLength][config.lastDate].buyTicker;
					config.buyWeight = expectedTickerConfig.nextBuyTickerMomentumDataObj[bestLength][config.lastDate].buyWeight;
//					config.buyTicker = config.longDataList[config.longDataList.length - 1].ticker;
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
				var nextBuyTickerMomentumDataObj = expectedTickerConfig.nextBuyTickerMomentumDataObj;
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
				var nextBuyTickerMomentumData = expectedTickerConfig.nextBuyTickerMomentumDataObj[maxLength];
				var todayBuyTickerData = {};
				var nextBuyTickerMomentumResultList = [];
				var nextBuyTickerMomentumResultListObj = expectedTickerConfig.nextBuyTickerMomentumResultListObj;
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
};


			
function initNextBuyTickerResult(config) {
	var nextBuyTickerResultList = config.nextBuyTickerResultList;
	var nextBuyTickerDataObj = config.nextBuyTickerDataObj;
	var longDataList = config.longDataList;
	var shortDataList = config.shortDataList;
	var longTicker = config.longTicker;
	var shortTicker = config.shortTicker;
	var resultDataList = [];
	var todayBuyTickerData = {};
	var myStock = {
		money: 0,
		betMoney: 30000,
		defaultBetMoney: 20000,
		maxBetMoney: 30000,
		positionTicker: "",
		charge: 0.001,
		profitAndLoss: 0,
		profitAndLossList: [],
		profitAndLossListByMonth: [],
		profitAndLossListByYear: [],
		lastMonth: "0",
		lastYear: "0",
		nextMonth: "0",
		nextYear: "0",
		stopLossWight: 1,
	}
	
	var idx = 0;
	while(idx < longDataList.length) {
		var longRow = longDataList[idx];
		var shoutRow = shortDataList[idx];
		var date = longRow.date;
		var buyRow = {};
		var LastBuyRow = {};
		var stopLoss = 0;
		var successFlag = false;
		var curChange = 0;
		var charge = 0;
		
		if (todayBuyTickerData.buyFlag === true) {
			if (todayBuyTickerData.ticker === longTicker) {
				buyRow = longRow;
				LastBuyRow = longDataList[idx - 1];
				stopLoss = round4(todayBuyTickerData.averageByMinus * myStock.stopLossWight);
			} else if (todayBuyTickerData.ticker === shortTicker) {
				buyRow = shoutRow;
				LastBuyRow = shortDataList[idx - 1];
				stopLoss = round4(todayBuyTickerData.averageByPlus * myStock.stopLossWight * -1);
			}
							
//			var stopLossByOpenPrice = round4(buyRow.openPrice / LastBuyRow.closePrice - 1);
			var stopLossyLowPrice = round4(buyRow.lowPrice / LastBuyRow.closePrice - 1);
//			if (stopLossByOpenPrice < stopLoss) {
//				console.log(stopLossByOpenPrice)
//				curChange = stopLossByOpenPrice;
//				myStock.positionTicker = "";
//			} else 
			if (stopLossyLowPrice < stopLoss) {
				curChange = stopLoss;
				myStock.positionTicker = "";
			} else {
				curChange = buyRow.change;
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
//				myStock.betMoney = myStock.defaultBetMoney;
			}
			
//			if (myStock.defaultBetMoney > myStock.betMoney) {
//				myStock.betMoney = myStock.defaultBetMoney;
//			} else if (myStock.maxBetMoney < myStock.betMoney) {
//				myStock.betMoney = myStock.maxBetMoney; 
//			}
//			myStock.betMoney = round2((myStock.defaultBetMoney + myStock.profitAndLoss) * 0.8);
			var betMoney = round2(myStock.betMoney * todayBuyTickerData.weight);
			if (myStock.positionTicker !== todayBuyTickerData.ticker) {
				charge = round2(myStock.betMoney * myStock.charge);
			}
			myStock.positionTicker = todayBuyTickerData.ticker;
			
			var curProfitAndLoss = round2(betMoney * curChange - charge);
			myStock.profitAndLoss = round2(myStock.profitAndLoss + curProfitAndLoss);
			myStock.profitAndLossList.push(curProfitAndLoss);
			profitAndLossListByMonth[lastIdxByMonthList].profitAndLoss = round2(profitAndLossListByMonth[lastIdxByMonthList].profitAndLoss + curProfitAndLoss);
			profitAndLossListByYear[lastIdxByYearList].profitAndLoss = round2(profitAndLossListByYear[lastIdxByYearList].profitAndLoss + curProfitAndLoss);
			
			if (curProfitAndLoss > 0) {
				successFlag = true;
			}
				
			var result = {
				buyTicker: todayBuyTickerData.ticker,
				buyWeight: todayBuyTickerData.weight,
				successFlag: successFlag,
				change: curChange,
				betMoney: betMoney,
			}
			result[longTicker] = longRow;
			result[shortTicker] = shoutRow;
			resultDataList.push(result);
			
			if (resultDataList.length >= 120) {
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
				
				var avgProfitAndLossByMonth = d3.median(tempProfitAndLossListByMonth);
				var avgProfitAndLossByYear = d3.median(tempProfitAndLossListByYear);
				
				var successCnt = 0;
				var failCnt = 0;
				var sumSuccessChange = 0;
				var sumFailChange = 0;
				resultDataList.forEach(function(cur) {
					if (cur.successFlag === true) {
						successCnt++;
						sumSuccessChange = round4(sumSuccessChange + cur.change)
					} else if (cur.successFlag === false) {
						failCnt++;
						sumFailChange = round4(sumFailChange + cur.change)
					}
				})
				
				var avgSuccessPercent = round4(successCnt / resultDataList.length);
				var avgSuccessChange = round4(sumSuccessChange / successCnt);
				var avgFailPercent = round4(failCnt / resultDataList.length);
				var avgFailChange = round4(sumFailChange / failCnt);
				
				var nextBuyTickerResultData = {
					seq: config.seq,
					date: date,
					profitAndLoss: round0(myStock.profitAndLoss),
					oneMonthAgoProfitAndLoss: round0(d3.sum(myStock.profitAndLossList.slice(-20))),
					twoMonthAgoProfitAndLoss: round0(d3.sum(myStock.profitAndLossList.slice(-20 * 2))),
					threeMonthAgoProfitAndLoss: round0(d3.sum(myStock.profitAndLossList.slice(-20 * 3))),
					sixMonthAgoProfitAndLoss: round0(d3.sum(myStock.profitAndLossList.slice(-20 * 6))),
					avgProfitAndLossByMonth: round0(avgProfitAndLossByMonth),
					avgProfitAndLossByYear: round0(avgProfitAndLossByYear),
					avgSuccessPercent: avgSuccessPercent,
					avgSuccessChange: avgSuccessChange,
					avgFailPercent: avgFailPercent,
					avgFailChange: avgFailChange,
				}
				
				nextBuyTickerResultList.push(nextBuyTickerResultData);
				todayBuyTickerData = {};
			}
		}
		
		if (nextBuyTickerDataObj.hasOwnProperty(date) === false || isEmptyObj(nextBuyTickerDataObj[date]) === true) {
			idx++;
			continue;
		}
		
		todayBuyTickerData = nextBuyTickerDataObj[date];
		todayBuyTickerData.date = date;
		todayBuyTickerData.buyFlag = true;
		idx++;
	}
	
//	if (config.isSimulation === true) {
		console.log(resultDataList);
		console.log(nextBuyTickerDataObj);
		console.log(todayBuyTickerData);
		console.log(myStock);
		console.log(config.nextBuyTickerResultList[config.nextBuyTickerResultList.length - 1]);
//	}
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


function insertScript(seq, script) {
	$.ajax({
		type: "post",
		url: "/data/insert/script",
		data: JSON.stringify({
			seq: seq,
			script: script,
		}),
		contentType: 'application/json; charset=utf-8',
		dataType : "json"
	})
	.done(function(resp) {
		if (resp.success === true) {
			console.log("스크립트 저장 성공");
		} else {
			console.log("스크립트 저장 실패");
		}
	})
	.fail(function() {
		console.log("스크립트 저장 실패");
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
