package com.stock.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DataMapper {
	
	String getLastDate(String ticker);
	int insert(List<Map<String, Object>> tickerDataList);
	List<Map<String, Object>> select(String ticker);
	String getLastSeq();
	int insertBuyTicker(List<Map<String, Object>> buyTickerList);
	List<Map<String, Object>> selectBuyTicker(int seq);
	int insertBuyResult(Map<String, Object> buyResultData);

}
