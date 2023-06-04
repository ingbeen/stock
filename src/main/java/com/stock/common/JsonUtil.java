package com.stock.common;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.JsonParser;

public class JsonUtil {

	private static class MapDeserializer implements JsonDeserializer<Map<String,Object>> {
		public Map<String,Object> deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
			Map<String,Object> m = new LinkedHashMap<>();
			JsonObject jo = json.getAsJsonObject();
			Set<Entry<String, JsonElement>> joSet = null;
			
			if (jo != null) {
				joSet = jo.entrySet();
			}
			
			if (joSet != null) {
				for (Entry<String, JsonElement>  mx : joSet){
					String key = mx.getKey();
					JsonElement v = mx.getValue();
					
					if (v.isJsonPrimitive()) {
						if(v.getAsString().equals("true") || v.getAsString().equals("false")) {
							m.put(key, v.getAsBoolean());
						} else {
							m.put(key, v.getAsString());
						}
					} else if(v.isJsonObject()){
						m.put(key, g.fromJson(v, Map.class));
					} else if(v.isJsonArray()){
						m.put(key, g.fromJson(v, List.class));
					} else if(v.isJsonNull()){
						m.put(key, "");
					}
				}
			}
			return m;
		}
	}

	private static class ListDeserializer implements JsonDeserializer<List<Object>> {
		public List<Object> deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
			List<Object> m  = new ArrayList<>();
			JsonArray arr = json.getAsJsonArray();
			
			if (arr != null) {
				for (JsonElement jsonElement : arr) {
					if(jsonElement.isJsonObject()){
						m.add(g.fromJson(jsonElement, Map.class));
					}else if(jsonElement.isJsonPrimitive()){
						m.add(jsonElement.getAsString());
					}else if(jsonElement.isJsonArray()){
						m.add(g.fromJson(jsonElement, List.class));
					}else if(jsonElement.isJsonNull()){
						m.add("");
					}
				}
			}
			return m;
		}
	}

	private static Gson g = new GsonBuilder().registerTypeAdapter(Map.class, new MapDeserializer()).registerTypeAdapter(List.class, new ListDeserializer()).setDateFormat("yyyy-MM-dd HH:mm:ss").serializeNulls().create();

	/**
	 * JSON 문자열을 LIST로 변환
	 * @param paramMap
	 * @param key
	 * @return
	 * @throws Exception
	 */
	public static List<Map<String, Object>> getListMap(Map<String, Object> paramMap, String key) {
		return paramMap.get(key) == null ? new ArrayList<>() : getListMap((String) paramMap.get(key));
	}

	/**
	 * JSON 문자열을 LIST로 변환
	 * @param jsonStr
	 * @return
	 * @throws Exception
	 */
	@SuppressWarnings("unchecked")
	public static List<Map<String, Object>> getListMap(String jsonStr) {
		JsonParser parser = new JsonParser();	// Json Parser
		JsonArray jArray = null;	// Json Array
		List<Map<String, Object>> listmap = null;
		
		// Json String -> Json Array
		if (jsonStr != null) {
			jArray = parser.parse(jsonStr).getAsJsonArray();
			if (jArray != null) {
				listmap = g.fromJson(jArray, List.class);
			}
		}
		if (listmap == null) {
			listmap = new ArrayList<>();
		}

		return listmap;
	}
		
	/**
	 * JSON 문자열을 LIST로 변환
	 * @param jsonStr
	 * @return
	 * @throws Exception
	 */
	@SuppressWarnings("unchecked")
	public static List<Object> getList(String jsonStr) throws Exception {
		JsonParser parser = new JsonParser();	// Json Parser
		JsonArray jArray = null;	// Json Array
		List<Object> list = null;
		
		// Json String -> Json Array
		if (jsonStr != null) {
			jArray = parser.parse(jsonStr).getAsJsonArray();
			if (jArray != null) {
				list = g.fromJson(jArray, List.class);
			}
		}
		
		if (list == null) {
			list = new ArrayList<>();
		}
		
		return list;
	}

	/**
	 * JSON 문자열을 MAP으로 변환
	 * @param paramMap
	 * @param key
	 * @return
	 * @throws Exception
	 */
	public static Map<String, Object> getMap(Map<String, Object> paramMap, String key) {
		return paramMap.get(key) == null ? new HashMap<>() : getMap((String) paramMap.get(key));
	}

	/**
	 * JSON 문자열을 MAP으로 변환
	 * @param jsonStr
	 * @return
	 * @throws Exception
	 */
	@SuppressWarnings("unchecked")
	public static Map<String, Object> getMap(String jsonStr) {
		JsonParser parser = new JsonParser();	// Json Parser
		JsonObject object = null;	// Json Array
		Map<String, Object> map = null;

		if (jsonStr != null) {
			// Json String -> Json Array
			object = parser.parse(jsonStr).getAsJsonObject();
			if (object != null) {
				map = g.fromJson(object, Map.class);
			}
		}
		if (map == null) {
			map = new HashMap<String, Object>();
		}
		return map;
	}

	/**
	 * Gson을 이용한 String -> Class<T>.
	 * @param <T>
	 * @param jsonString
	 * @param classOfT
	 * @return T
	 */
	public static <T> T fromJsonGson(final String jsonString, final Class<T> classOfT) {
		return g.fromJson(jsonString, classOfT);
	}

	/**
	 * Gson을 이용한 String -> List<Class<T>>.
	 * @param <T>
	 * @param jsonString
	 * @param classOfT
	 * @return List<T>
	 */
	public static <T> List<T> fromJsonGsonList(final String jsonString, final Class<T> classOfT) {
		List<T> voList = new ArrayList<>();
		JsonArray arr = fromJsonArrayGson(jsonString);
		if (arr != null) {
			for (JsonElement el : arr) {
				voList.add(g.fromJson(el, classOfT));
			}
		}
		return voList;
	}

	/**
	 * Gson을 이용한 jsonElement -> Class<T>.
	 * @param <T>
	 * @param jsonElement
	 * @param type
	 * @return T
	 */
	public static <T> T fromJsonGson(final JsonElement jsonElement, final Type type) {
		return g.fromJson(jsonElement, type);
	}

	/**
	 * Gson을 이용한 String -> Class<T>.
	 * @param <T>
	 * @param jsonString
	 * @param typeOfT
	 * @return T
	 */
	public static <T> T fromJsonGson(final String jsonString, final Type typeOfT) {
		return g.fromJson(jsonString, typeOfT);
	}

	/**
	 * String으로 넘어온 JSON 텍스트를 JsonArray 변환.
	 * @param jsonString
	 * @return JsonArray
	 * @throws Exception
	 */
	public static final JsonArray fromJsonArrayGson(final String jsonString) {
		JsonArray arr = null;
		JsonElement el = new JsonParser().parse(jsonString);

		if (jsonString != null) {
			arr = el.getAsJsonArray();
		}
		return arr;
	}

	public static String toJson(final Object obj) {
		return g.toJson(obj);
	}
}
