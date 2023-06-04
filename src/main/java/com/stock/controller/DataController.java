package com.stock.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
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
					int closeDate = Integer.parseInt((String) tickerData.get("close_date"));
					if (closeDate <= lastDate) continue;
					
					tickerData.put("ticker", ticker);
					tempTickerDataList.add(tickerData);
					if (tempTickerDataList.size() % limit == 0) {
						insertCnt = insertCnt + dataMapper.insert(tempTickerDataList);
						tempTickerDataList.clear();
					}
				}
				
				if (tempTickerDataList.size() > 0) {
					insertCnt = insertCnt + dataMapper.insert(tempTickerDataList);
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
	
}
