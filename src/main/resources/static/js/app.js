(function() {
	bind();
//	$("#upload").trigger("click");
//	$("#expectedTicker").trigger("click");
//	$("#expectedTicker_loop").trigger("click");
//	$("#buyResult").trigger("click");
//	$("#buyResult_loop").trigger("click");
	
	function bind() {
		var buyResultConfig = {
			originConfigStr: "",
			loopCnt: 1,
			loopEndSeq: 9,
		}
		
		$("#buyResult_loop").on("click", function(e, param) {
			var config = {
				longTicker: "tqqq",
				shortTicker: "sqqq",
				tickerData: {},
				longDataList: [],
				shortDataList: [],
				buyTickerList: [],
				buyTickerData: {},
				buyResultData: {},
				seq: 1,
			}
			
			buyResultConfig.originConfigStr = JSON.stringify(config);
					
			// loop가 아닐경우 위 config와 다른점을 명시한다
			if (!isEmptyObj(param) && param.isLoop === false) {
				config.isLoop = false;
				config.seq = 1;
			}
			
			$("#buyResult").trigger("click", config);
		})
		
		$("#buyResult").on("click", function(e, config) {
			if (isEmptyObj(config)) {
				$("#buyResult_loop").trigger("click", {isLoop: false});
				return;
			}
			
			getBuyTickerList()
				.then(function(buyTickerList) {
					config.buyTickerList = buyTickerList;
					buyTickerListToMap();
					return getTickerData(config)
				})
				.then(function(tickerData) {
					config.tickerData = tickerData;
					config.longDataList = tickerData[config.longTicker];
					config.shortDataList = tickerData[config.shortTicker];
					buyResult();
					insertBuyResultData();
				})
				.catch(function(e) {
					if (e !== undefined) console.log(e.stack);
					alert("매수결과 실행에 실패하였습니다.");
				})
	        
	        function insertBuyResultData() {
				$.ajax({
					type: "post",
					url: "/data/insert/buyResult",
					data: JSON.stringify({
						seq: config.seq,
						buyResultData: config.buyResultData
					}),
					contentType: 'application/json; charset=utf-8',
					dataType : "json"
				})
				.done(function(resp) {
					if (config.isLoop === false) {
						if (resp.success === true) {
							alert("매수결과 데이터 업로드 성공 (seq : " + resp.seq + " / insertCnt : " + resp.insertCnt + ")");
						} else {
							alert("매수결과 데이터 업로드 실패");
						}
					} else {
						var originConfig = JSON.parse(buyResultConfig.originConfigStr);
						originConfig.seq = config.seq;
						originConfig.seq++;

						console.log("loopCnt : " + buyResultConfig.loopCnt + ", " + config.seq + "/" + buyResultConfig.loopEndSeq);
						if (buyResultConfig.loopEndSeq < originConfig.seq) {
							alert("매수결과 데이터 업로드 성공 (last seq : " + resp.seq + " / loopCnt : " + expectedTickerConfig.loopCnt + ")");
						} else {
							buyResultConfig.loopCnt++;
							$("#buyResult").trigger("click", originConfig);
						}
					}
				})
			}
			
			function buyTickerListToMap() {
				var nextBuyTickerData = {};
				config.buyTickerList.forEach(function(cur) {
					var date = cur.date;
					delete cur.date;
					nextBuyTickerData[date] = cur;
				})
				config.nextBuyTickerData = nextBuyTickerData;
			}
			
			function buyResult() {
				var nextBuyTickerData = config.nextBuyTickerData;
				var longDataList = config.longDataList;
				var shortDataList = config.shortDataList;
				var longTicker = config.longTicker;
				var shortTicker = config.shortTicker;
				var resultDataList = [];
				var buyTickerData = {};
				var oneMonthAgoDate = moment(longDataList[longDataList.length - 1].date).subtract(1, "M").format("YYYYMMDD");
				var twoMonthAgoDate = moment(longDataList[longDataList.length - 1].date).subtract(2, "M").format("YYYYMMDD");
				var threeMonthAgoDate = moment(longDataList[longDataList.length - 1].date).subtract(3, "M").format("YYYYMMDD");
				var sixMonthAgoDate = moment(longDataList[longDataList.length - 1].date).subtract(6, "M").format("YYYYMMDD");
				var oneYearAgoDate = moment(longDataList[longDataList.length - 1].date).subtract(1, "Y").format("YYYYMMDD");
				var myStock = {
					betMoney: 15000,
					defaultBetMoney: 15000,
					maxBetMoney: 30000,
					positionTicker: "",
					charge: 0.001,
					profitAndLoss: 0,
					profitAndLossListByMonth: [],
					profitAndLossListByYear: [],
					lastMonth: "0",
					lastYear: "0",
					nextMonth: "0",
					nextYear: "0",
					oneMonthAgoProfitAndLoss: 0,
					twoMonthAgoProfitAndLoss: 0,
					threeMonthAgoProfitAndLoss: 0,
					sixMonthAgoProfitAndLoss: 0,
					oneYearAgoProfitAndLoss: 0,
				}
				
				longDataList.forEach(function(longRow, idx) {
					var date = longRow.date;
					var buyRow = {};
					var LastBuyRow = {};
					var stopLoss = 0;
					var successFlag = false;
					var curChange = 0;
					var charge = 0;
					
					if (buyTickerData.buyFlag === true) {
						if (buyTickerData.ticker === longTicker) {
							buyRow = longRow;
							LastBuyRow = longDataList[idx - 1];
							stopLoss = round4(buyTickerData.averageByMinus * 1);
						} else if (buyTickerData.ticker === shortTicker) {
							buyRow = shortDataList[idx];
							LastBuyRow = shortDataList[idx - 1];
							stopLoss = round4(buyTickerData.averageByPlus * -1);
						}
						myStock.positionTicker = buyTickerData.ticker;
						
												
//						var stopLossByOpenPrice = round4(buyRow.openPrice / LastBuyRow.closePrice - 1);
						var stopLossyLowPrice = round4(buyRow.lowPrice / LastBuyRow.closePrice - 1);
//						if (stopLossByOpenPrice < stopLoss) {
//							console.log(stopLossByOpenPrice)
//							curChange = stopLossByOpenPrice;
//							myStock.positionTicker = "";
//						} else 
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
							myStock.betMoney = myStock.defaultBetMoney;
						}
						
						if (myStock.defaultBetMoney > myStock.betMoney) {
							myStock.betMoney = myStock.defaultBetMoney;
						} else if (myStock.maxBetMoney < myStock.betMoney) {
							myStock.betMoney = myStock.maxBetMoney; 
						}
//						myStock.betMoney = round2((myStock.defaultBetMoney + myStock.profitAndLoss) * 0.8);
						
						if (myStock.positionTicker !== buyTickerData.ticker) {
							charge = round2(myStock.betMoney * myStock.charge);
						}
						
						var curProfitAndLoss = myStock.betMoney * curChange - charge;
						var afterBetMoney = myStock.betMoney;
						myStock.betMoney = round2(myStock.betMoney + curProfitAndLoss);
						myStock.profitAndLoss = round2(myStock.profitAndLoss + curProfitAndLoss);
						profitAndLossListByMonth[lastIdxByMonthList].profitAndLoss = round2(profitAndLossListByMonth[lastIdxByMonthList].profitAndLoss + curProfitAndLoss);
						profitAndLossListByYear[lastIdxByYearList].profitAndLoss = round2(profitAndLossListByYear[lastIdxByYearList].profitAndLoss + curProfitAndLoss);
						
						if (oneMonthAgoDate < date) {
							myStock.oneMonthAgoProfitAndLoss = round2(myStock.oneMonthAgoProfitAndLoss + curProfitAndLoss);
						}
						
						if (twoMonthAgoDate < date) {
							myStock.twoMonthAgoProfitAndLoss = round2(myStock.twoMonthAgoProfitAndLoss + curProfitAndLoss);
						}
						
						if (threeMonthAgoDate < date) {
							myStock.threeMonthAgoProfitAndLoss = round2(myStock.threeMonthAgoProfitAndLoss + curProfitAndLoss);
						}
						
						if (sixMonthAgoDate < date) {
							myStock.sixMonthAgoProfitAndLoss = round2(myStock.sixMonthAgoProfitAndLoss + curProfitAndLoss);
						}
						
						if (oneYearAgoDate < date) {
							myStock.oneYearAgoProfitAndLoss = round2(myStock.oneYearAgoProfitAndLoss + curProfitAndLoss);
						}
						
						
						if (curProfitAndLoss > 0) {
							successFlag = true;
						}
							
						var result = {
							buyTicker: buyTickerData.ticker,
							successFlag: successFlag,
							change: curChange,
							betMoney: afterBetMoney,
							row: {}
						}
						result.row[longTicker] = longRow;
						result.row[shortTicker] = shortDataList[idx];
						
						resultDataList.push(result);
						buyTickerData = {};
					}
					
					if (nextBuyTickerData.hasOwnProperty(date) === false || isEmptyObj(nextBuyTickerData[date]) === true) return;
					
					buyTickerData = nextBuyTickerData[date];
					buyTickerData.buyFlag = true;
				})
				
				var sumProfitAndLossByMonth = 0;
				myStock.profitAndLossListByMonth.forEach(function(cur) {
					sumProfitAndLossByMonth = round2(sumProfitAndLossByMonth + cur.profitAndLoss);
				})
				
				var sumProfitAndLossByYear = 0;
				myStock.profitAndLossListByYear.forEach(function(cur) {
					sumProfitAndLossByYear = round2(sumProfitAndLossByYear + cur.profitAndLoss);
				})
				
				var avgProfitAndLossByMonth = round2(sumProfitAndLossByMonth / myStock.profitAndLossListByMonth.length);
				var avgProfitAndLossByYear = round2(sumProfitAndLossByYear / myStock.profitAndLossListByYear.length);
				
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
				
				var json = {
					buyTickerData: config.nextBuyTickerData,
					resultDataList: resultDataList,
					myStock: myStock,
				}
				
				var buyResultData = {
					seq: config.seq,
					profitAndLoss: round0(myStock.profitAndLoss),
					oneMonthAgoProfitAndLoss: round0(myStock.oneMonthAgoProfitAndLoss),
					twoMonthAgoProfitAndLoss: round0(myStock.twoMonthAgoProfitAndLoss),
					threeMonthAgoProfitAndLoss: round0(myStock.threeMonthAgoProfitAndLoss),
					sixMonthAgoProfitAndLoss: round0(myStock.sixMonthAgoProfitAndLoss),
					oneYearAgoProfitAndLoss: round0(myStock.oneYearAgoProfitAndLoss),
					avgProfitAndLossByMonth: round0(avgProfitAndLossByMonth),
					avgProfitAndLossByYear: round0(avgProfitAndLossByYear),
					avgSuccessPercent: avgSuccessPercent,
					avgSuccessChange: avgSuccessChange,
					avgFailPercent: avgFailPercent,
					avgFailChange: avgFailChange,
					jsonStr: JSON.stringify(json),
				}
				config.buyResultData = buyResultData;
				
				if (config.isLoop === false) {
					console.log("config.seq : " + config.seq);
					console.log("총 손익 : " + buyResultData.profitAndLoss);
					console.log("월평균 손익 : " + buyResultData.avgProfitAndLossByMonth);
					console.log("연평균 손익 : " + buyResultData.avgProfitAndLossByYear);
					console.log("성공, 확률 : " + avgSuccessPercent + " / 평균손익 : " + avgSuccessChange);
					console.log("실패, 확률 : " + avgFailPercent + " / 평균손익 : " + avgFailChange);
					console.log(json);
				}
			}
					
			function getBuyTickerList() {
				return new Promise(function(resolve, reject) {
					$.ajax({
						type: "post",
						url: "/data/select/buyTicker",
						data: JSON.stringify({
							seq: config.seq
						}),
						contentType: 'application/json; charset=utf-8',
						dataType : "json"
					})
					.done(function(resp) {
						if (resp.success === true) {
							resolve(resp.buyTickerList);
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
		}
		
		$("#expectedTicker_loop").on("click", function(e, param) {
			var config = {
				longTicker: "tqqq",
				shortTicker: "sqqq",
				tickerData: {},
				startLength: 5,
				endLength: 5,
				dateInfo: {},
				momentumDataByLength: {},
				averageData: {},
				momentumResultDataByLength: {},
				buyTickerList: [],
			}
			
			expectedTickerConfig.originConfigStr = JSON.stringify(config);
			
			getTickerData(config)
				.then(function(tickerData) {
					expectedTickerConfig.tickerData = tickerData;
					
					// loop가 아닐경우 위 config와 다른점을 명시한다
					if (!isEmptyObj(param) && param.isLoop === false) {
						config.isLoop = false;
						config.endLength = 60;
					}
					
					$("#expectedTicker").trigger("click", config);
				})
				.catch(function(e) {
					if (e !== undefined) console.log(e.stack);
					alert("예상종목 실행에 실패하였습니다.");
				})
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
			
			var fiveYearlaterDate = moment(longDataList[0].date, "YYYYMMDD").add(5, 'year').format("YYYYMMDD");
			var idx = 0;
			while(idx < longDataList.length) {
				tempLongDataList.push(longDataList[idx]);
				tempShortDataList.push(shortDataList[idx]);
				
				if (longDataList[idx].date < fiveYearlaterDate) {
					idx++;
					continue;
				}
				
				config.idxMsg = "[" + (idx + 1) + "/" + longDataList.length + "]" + " / ";
				config.longDataList = tempLongDataList;
				config.shortDataList = tempShortDataList;
				runHandler();
				idx++;
			}
			
			insertBuyTickerList();
	        
	        function insertBuyTickerList() {
				$.ajax({
					type: "post",
					url: "/data/insert/buyTicker",
					data: JSON.stringify({
						buyTickerList: JSON.stringify(config.buyTickerList)
					}),
					contentType: 'application/json; charset=utf-8',
					dataType : "json"
				})
				.done(function(resp) {
					if (config.isLoop === false) {
						if (resp.success === true) {
							alert("예상종목 데이터 업로드 성공 (seq : " + resp.seq + " / insertCnt : " + resp.insertCnt + ")");
						} else {
							alert("예상종목 데이터 업로드 실패");
						}
					} else {
						var originConfig = JSON.parse(expectedTickerConfig.originConfigStr);
						originConfig.endLength = config.endLength;
						originConfig.endLength++;

						console.log("loopCnt : " + expectedTickerConfig.loopCnt + ", " + config.endLength + "/" + expectedTickerConfig.loopEndLength);
						if (expectedTickerConfig.loopEndLength < originConfig.endLength) {
							alert("반복 예상종목 데이터 업로드 성공 (last seq : " + resp.seq + " / loopCnt : " + expectedTickerConfig.loopCnt + ")");
						} else {
							expectedTickerConfig.loopCnt++;
							$("#expectedTicker").trigger("click", originConfig);
						}
					}
				})
			}
			
			function runHandler() {
				initDate();
				calculate();
				initBestPosition();
				if (isEmptyStr(config.buyTicker) === false) {
					setBuyTickerList();
				}
			}
			
			function setBuyTickerList() {
				var buyTickerInfo = {};
				buyTickerInfo.date = config.dateInfo.lastDate; 
				buyTickerInfo.ticker = config.buyTicker;
				buyTickerInfo.bestLength = config.bestLength;
				buyTickerInfo.bestPercent = config.bestPercent;
				buyTickerInfo.averageByPlus = config.averageByPlus;
				buyTickerInfo.averageByMinus = config.averageByMinus;
				
				config.buyTickerList.push(buyTickerInfo);
				console.log(config.idxMsg + JSON.stringify(buyTickerInfo));
			}
			
			function initBestPosition() {
				initBuyTicker();
				initBestAaverage();
			}
			
			function initBestAaverage() {
				var averageData = config.averageData;
				config.averageByPlus = round4((averageData.all.plus * 10 + averageData.fiveYearAgo.plus * 20 + averageData.threeYearAgo.plus * 30 + averageData.oneYearAgo.plus * 40) / 100);
				config.averageByMinus = round4((averageData.all.minus * 10 + averageData.fiveYearAgo.minus * 20 + averageData.threeYearAgo.minus * 30 + averageData.oneYearAgo.minus * 40) / 100);
			}
			
			function initBuyTicker() {
				var successPercentData = {};
				var maxLength = config.startLength;
				while(maxLength <= config.endLength) {
					var momentumResultList = config.momentumResultDataByLength[maxLength];
					var cnt = 0;
					var successCnt = 0;
					
					momentumResultList.forEach(function(cur) {
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
					config.buyTicker = config.momentumDataByLength[bestLength][config.dateInfo.lastDate].buyTicker;
//					config.buyTicker = config.longDataList[config.longDataList.length - 1].ticker;
				}
			}
			
			function calculate() {
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
			
			function initMomentumDataByLength(maxLength) {
				var lastChangeList = [];
				var momentumData = {};
				var longDataList = config.longDataList;
				
				longDataList.forEach(function(row) {
					lastChangeList.push(row.change);
					if (lastChangeList.length <= maxLength) return;
					lastChangeList.shift();
					
					var weight = maxLength;
					var idx = maxLength - 1;
					var sumMomentum = 0;
					while(idx >= 0) {
						var change = lastChangeList[idx];
						if (change > 0) {
							sumMomentum += 1 * weight;
						} else if (change < 0) {
							sumMomentum -= 1 * weight;
						}
						weight--;
						idx--;
					}
					
					var buyTicker = "";
					if (sumMomentum > 0) {
						buyTicker = config.longTicker;
					} else if (sumMomentum < 0) {
						buyTicker = config.shortTicker;
					}
					
					// {20160505 : tqqq}
					// 설명 : 20160505의 다음 거래일날 tqqq 매수
					momentumData[row.date] = {
						buyTicker: buyTicker
					};
				})
				
				config.momentumDataByLength[maxLength] = momentumData;
			}
			
			function initMomentumResultDataByLength(maxLength) {
				var longDataList = config.longDataList;
				var shortDataList = config.shortDataList;
				var longTicker = config.longTicker;
				var shortTicker = config.shortTicker;
				var momentumData = config.momentumDataByLength[maxLength];
				var buyTickerData = {};
				var momentumResultList = [];
				var momentumResultDataByLength = config.momentumResultDataByLength;
				
				longDataList.forEach(function(longRow, idx) {
					var date = longRow.date;
					var successFlag = false;
					
					// 아래의 buyTickerData에 데이터가 존재해야됨.
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
							date: date,
							buyTicker: buyTickerData.ticker,
							weight: buyTickerData.weight,
							successFlag: successFlag,
							row: {}
						}
						result.row[longTicker] = longRow;
						result.row[shortTicker] = shortRow;
						
						momentumResultList.push(result);
						buyTickerData = {};
					}
					
					// momentumDataByLength는 다음날의 사야될 ticker를 알려준다
					if (momentumData.hasOwnProperty(date) === false || isEmptyStr(momentumData[date].buyTicker) === true) return;
					
					// buyTickerData.buyFlag = true로 바꾸면서 다음 거래일날 buyTickerData.ticker에 대한 successFlag값을 구할수 있음.
					buyTickerData = {
						buyFlag: true,
						ticker: momentumData[date].buyTicker,
						weight: momentumData[date].weight,
					}
				})
				
				// 0 :{date: '20151118', buyTicker: 'tqqq', successFlag: true, row: {…}}
				// 설명 : 20151118에 tqqq를 샀더니 successFlag:true(성공)을 했다
				momentumResultDataByLength[maxLength] = momentumResultList.slice(config.endLength * -1);
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
