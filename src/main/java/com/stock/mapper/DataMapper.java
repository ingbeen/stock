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
	int insertNextBuyTicker(List<Map<String, Object>> nextBuyTicker);
	List<Map<String, Object>> selectNextBuyTicker(int seq);
	String getLastSubSeq(int subSeq);
	int insertNextBuyTickerResult(List<Map<String, Object>> buyResultData);
	List<Map<String, Object>> selectNextBuyTickerResult();

}
