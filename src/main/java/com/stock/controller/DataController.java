package com.stock.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.stock.common.JsonUtil;
import com.stock.common.StringUtil;
import com.stock.mapper.DataMapper;

@RestController
@RequestMapping("/data")
public class DataController {
	
	@Autowired
	private DataMapper dataMapper;
	
	@ResponseBody
	@PostMapping("/insert")
	public Map<String, Object> insert(@RequestBody Map<String, Object> param) {
		Map<String, Object> result = new HashMap<>();
		
		try {
			for(String ticker : param.keySet()) {
				String tickerDataListStr = (String) param.get(ticker);
				List<Map<String, Object>> tickerDataList = JsonUtil.getListMap(tickerDataListStr);
				int lastDate = Integer.parseInt(StringUtil.nvl(dataMapper.getLastDate(ticker), "0"));
				int insertCnt = 0;
				
				List<Map<String, Object>> tempTickerDataList = new ArrayList<>();
				int limit = 1000;
				for (Map<String, Object> tickerData : tickerDataList) {
					int closeDate = Integer.parseInt((String) tickerData.get("date"));
					if (closeDate <= lastDate) continue;
					
					tickerData.put("ticker", ticker);
					tempTickerDataList.add(tickerData);
					if (tempTickerDataList.size() % limit == 0) {
						insertCnt += dataMapper.insert(tempTickerDataList);
						tempTickerDataList.clear();
					}
				}
				
				if (tempTickerDataList.size() > 0) {
					insertCnt += dataMapper.insert(tempTickerDataList);
				}
				
				result.put(ticker, insertCnt);
			}
			
			result.put("success", true);
		} catch (Exception e) {
			e.printStackTrace();
			result.put("success", false);
		}
		
		return result;
	}
	
	@ResponseBody
	@PostMapping("/select")
	public Map<String, Object> select(@RequestBody Map<String, Object> param) {
		Map<String, Object> result = new HashMap<>();
		
		try {
			String tickerListStr = (String) param.getOrDefault("tickerList", "");
			List<Object> tickerList = JsonUtil.getList(tickerListStr);
			Map<String, Object> tickerData = new HashMap<>();
			
			for(Object t : tickerList) {
				String ticker = (String) t;
				List<Map<String, Object>> tickerDataList = dataMapper.select(ticker);
				tickerData.put(ticker, tickerDataList);
			}

			result.put("tickerData", tickerData);
			result.put("success", true);
		} catch (Exception e) {
			e.printStackTrace();
			result.put("success", false);
		}
		
		return result;
	}
	
	@ResponseBody
	@PostMapping("/insert/nextBuyTicker")
	public Map<String, Object> insertNextBuyTicker(@RequestBody Map<String, Object> param) {
		Map<String, Object> result = new HashMap<>();
		
		try {
			List<Map<String, Object>> nextBuyTickerList = JsonUtil.getListMap((String) param.get("nextBuyTickerList"));
			int seq = Integer.parseInt(StringUtil.nvl(dataMapper.getLastSeq(), "0")) + 1;
			int insertCnt = 0;
			
			List<Map<String, Object>> tempNextBuyTickerList = new ArrayList<>();
			int limit = 1000;
			for (Map<String, Object> nextBuyTickerata : nextBuyTickerList) {
				nextBuyTickerata.put("seq", seq);
				tempNextBuyTickerList.add(nextBuyTickerata);
				if (tempNextBuyTickerList.size() % limit == 0) {
					insertCnt += dataMapper.insertNextBuyTicker(tempNextBuyTickerList);
					tempNextBuyTickerList.clear();
				}
			}
			
			if (tempNextBuyTickerList.size() > 0) {
				insertCnt += dataMapper.insertNextBuyTicker(tempNextBuyTickerList);
			}

			result.put("seq", seq);
			result.put("insertCnt", insertCnt);
			result.put("success", true);
		} catch (Exception e) {
			e.printStackTrace();
			result.put("success", false);
		}
		
		return result;
	}
	
	@ResponseBody
	@PostMapping("/select/nextBuyTicker")
	public Map<String, Object> selectNextBuyTicker(@RequestBody Map<String, Object> param) {
		Map<String, Object> result = new HashMap<>();
		
		try {
			int seq = (int) param.get("seq");
			List<Map<String, Object>> nextBuyTickerList = dataMapper.selectNextBuyTicker(seq);

			result.put("nextBuyTickerList", nextBuyTickerList);
			result.put("success", true);
		} catch (Exception e) {
			e.printStackTrace();
			result.put("success", false);
		}
		
		return result;
	}
	
	@ResponseBody
	@PostMapping("/insert/nextBuyTickerResult")
	public Map<String, Object> insertNextBuyTickerResult(@RequestBody Map<String, Object> param) {
		Map<String, Object> result = new HashMap<>();
		
		try {
			List<Map<String, Object>> nextBuyTickerResultList = JsonUtil.getListMap((String) param.get("nextBuyTickerResultList"));
			int insertCnt = 0;

			List<Map<String, Object>> tempNextBuyTickerResultList = new ArrayList<>();
			int limit = 1000;
			for (Map<String, Object> nextBuyTickerResultData : nextBuyTickerResultList) {
				tempNextBuyTickerResultList.add(nextBuyTickerResultData);
				if (tempNextBuyTickerResultList.size() % limit == 0) {
					insertCnt += dataMapper.insertNextBuyTickerResult(tempNextBuyTickerResultList);
					tempNextBuyTickerResultList.clear();
				}
			}
			
			if (tempNextBuyTickerResultList.size() > 0) {
				insertCnt += dataMapper.insertNextBuyTickerResult(tempNextBuyTickerResultList);
			}
			
			result.put("insertCnt", insertCnt);
			result.put("success", true);
		} catch (Exception e) {
			e.printStackTrace();
			result.put("success", false);
		}
		
		return result;
	}
	
	@ResponseBody
	@GetMapping("/select/nextBuyTickerResult")
	public Map<String, Object> selectNextBuyTickerResult() {
		Map<String, Object> result = new HashMap<>();
		
		try {
			List<Map<String, Object>> nextBuyTickerResultList = dataMapper.selectNextBuyTickerResult();

			result.put("nextBuyTickerResultList", nextBuyTickerResultList);
			result.put("success", true);
		} catch (Exception e) {
			e.printStackTrace();
			result.put("success", false);
		}
		
		return result;
	}
	
	@ResponseBody
	@PostMapping("/insert/script")
	public Map<String, Object> insertScript(@RequestBody Map<String, Object> param) {
		Map<String, Object> result = new HashMap<>();
		
		try {
			dataMapper.insertScript(param);
			
			result.put("success", true);
		} catch (Exception e) {
			e.printStackTrace();
			result.put("success", false);
		}
		
		return result;
	}
	
}
