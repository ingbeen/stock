package com.stock.common;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

/**
 * @Class Name : GStringUtils.java
 * @Description : 클래스 설명을 기술합니다.
 * @author John Doe
 * @since 2011. 8. 3.
 * @version 1.0
 * @see
 *
 * @Modification Information
 *
 *               <pre>
 *    수정일         수정자              수정내용
 *  ===========    =========    ===========================
 *  2011. 8. 3.      John Doe      최초 생성
 * </pre>
 */

public class StringUtil {

	private StringUtil() {}

	/**
	 * 인자값으로 전달받은 두 문자열이 같은지 비교해서 같으면 true 틀리면 false 를 리턴한다
	 * @param str1
	 * @param str2
	 * @return
	 */
	public static boolean equals(String str1, String str2) {
		return (null == str1 ? null == str2 : str1.compareTo(str2) == 0);
	}

	/**
	 * 전달받은 문자열이 null 인지 아닌지 체크한다
	 * @param str
	 * @return
	 */
	public static boolean isEmpty(String str) {
		return (str == null || str.trim().length() == 0);
	}

	/**
	 * 전달받은 인자값이 문자열인지 아닌지 체크한다
	 * @param str
	 * @return
	 */
	public static boolean isWord(String str) {
		if (null == str)
			return false;
		int len = str.length();
		for (int i = 0; i < len; i++) {
			if (!Character.isLetter(str.charAt(i))) {
				return false;
			}
		}
		return true;
	}

	/**
	 * 주어진 문자열이 AlphaNumeric인지 확인
	 *
	 * @param str
	 * @return
	 */
	public static boolean isAlphanumeric(String str) {
		if (null == str)
			return false;
		int len = str.length();
		for (int i = 0; i < len; i++) {
			if (!Character.isLetterOrDigit(str.charAt(i))) {
				return false;
			}
		}
		return true;
	}

	/**
	 * 주어진 문자열이 숫자인지 확인
	 *
	 * @param str
	 * @return
	 */
	public static boolean isNumeric(String str) {
		return str.matches("[-+]?\\d*\\.?\\d+");
		/*
		if (null == str)
			return false;
		int len = str.length();
		for (int i = 0; i < len; i++) {
			if (!Character.isDigit(str.charAt(i))) {
				return false;
			}
		}
		return true;
		 */
	}

	/**
	 * 문자열 앞뒤 공백을 없앰
	 *
	 * @param str
	 * @return
	 */
	public static String trim(String str) {
		return trim(str, null);
	}


	/**
	 *<pre>
	 * 인자로 받은 String이 null일 경우 &quot;&quot;로 리턴한다.
	 * &#064;param src null값일 가능성이 있는 String 값.
	 * &#064;return 만약 String이 null 값일 경우 &quot;&quot;로 바꾼 String 값.
	 *</pre>
	 */
	public static long zeroConvertLong(String src) {

		if (src == null || src.equals("null") || "".equals(src) || " ".equals(src)) {
			return 0;
		} else {
			return  Long.parseLong(src.trim());
		}
	}




	/**
	 * 문자열 앞뒤공백을 없앰, 만약 null이면 def를 돌려줌.
	 *
	 * @param str
	 * @param def
	 * @return
	 */
	public static String trim(String str, String def) {
		return (null == str ? def : str.trim());
	}

	/**
	 * 문자열 앞 공백을 없앰
	 *
	 * @param str
	 * @return
	 */
	public static String ltrim(String str) {
		return stripStart(str, null);
	}

	/**
	 * 문자열뒤 공백을 없앰
	 *
	 * @param str
	 * @return
	 */
	public static String rtrim(String str) {
		return stripEnd(str, null);
	}

	/**
	 * 좌측공백문자 제거
	 * @param str
	 * @param prefix
	 * @return
	 */
	private static String stripStart(String str, String prefix) {
		if (str == null)
			return str;
		int start = 0;
		if (prefix == null) {
			while (Character.isWhitespace(str.charAt(start))) {
				start++;
			}
		} else if (str.startsWith(prefix)) {
			if (str.equals(prefix))
				return "";
			return str.substring(prefix.length());
		}
		return str.substring(start);
	}

	/**
	 * 우측 공백문자 제거
	 * @param str
	 * @param postfix
	 * @return
	 */
	private static String stripEnd(String str, String postfix) {
		if (str == null)
			return str;
		int end = str.length();
		if (null == postfix) {
			while (Character.isWhitespace(str.charAt(end - 1))) {
				end--;
			}
		} else if (str.endsWith(postfix)) {
			if (str.equals(postfix))
				return "";
			return str.substring(0, str.lastIndexOf(postfix));
		}
		return str.substring(0, end);
	}

	/**
	 * leftPad, rightPad에 의해 실행되는 메소드
	 * @param str 문자열
	 * @param size사이즈
	 * @param padStr 채울 문자열
	 * @param where true : left, false : right
	 * @return 변환된 문자열
	 */
	private static String strPad(String str, int size, String padStr,
			boolean where) {
		if (str == null)
			return "";
		if (str.length() >= size)
			return str;

		String res = null;
		StringBuilder sb = new StringBuilder();
		String tmpStr = null;
		int tmpSize = size - str.length();

		for (int i = 0; i < size; i = i + padStr.length()) {
			sb.append(padStr);
		}
		tmpStr = sb.toString().substring(0, tmpSize);

		if (where)
			res = tmpStr.concat(str);
		else
			res = str.concat(tmpStr);
		return res;
	}

	/**
	 * 문자열과 자릿수 넘겨받아 문자열 왼쪽에서부터  자릿수(byte) 만큼 리턴
	 * @param str
	 * @param len
	 * @return
	 */
	public static String left(String str, int len) {
		if (str == null || len < 0)
			return "";
		if (str.length() < len)
			return str;
		else
			return str.substring(0, len);
	}

	/**
	 * 문자열과 자릿수 넘겨받아 문자열  오른쪽에서부터 자릿수(byte) 만큼 리턴
	 * @param str
	 * @param len
	 * @return
	 */
	public static String right(String str, int len) {
		if (str == null || len < 0)
			return "";
		if (str.length() < len)
			return str;
		else
			return str.substring(str.length() - len);
	}

	/**
	 * 문자열과 자릿수 인자 2개를 넘겨받아 pos 에서부터 len 까지의 문자열 리턴
	 * @param str
	 * @param pos
	 * @param len
	 * @return
	 */
	public static String mid(String str, int pos, int len) {
		if (str == null || len < 0 || pos > str.length())
			return "";
		if (pos < 0)
			pos = 0;
		if (str.length() < pos + len)
			return str.substring(pos);
		else
			return str.substring(pos, pos + len);
	}

	/**
	 * 문자열의 왼쪽에 해당 사이즈 만큼 문자로 채운다.
	 * @param str 문자열
	 * @param size 사이즈
	 * @param padChar 채울 문자
	 * @return 변환된 문자열
	 */
	public static String lPad(String str, int size, char padChar) {
		return lPad(str, size, String.valueOf(padChar));
	}

	/**
	 * 문자열의 왼쪽에 해당 사이즈 만큼 문자열로 채운다.
	 * @param str 문자열
	 * @param size 사이즈
	 * @param padStr 채울 문자열
	 * @return 변환된 문자열
	 */
	public static String lPad(String str, int size, String padStr) {
		return strPad(str, size, padStr, true);
	}

	/**
	 * 문자열의 오른쪽에 해당 사이즈 만큼 문자로 채운다.
	 * @param str 문자열
	 * @param size 사이즈
	 * @param padChar 채울 문자
	 * @return 변환된 문자열
	 */
	public static String rPad(String str, int size, char padChar) {
		return rPad(str, size, String.valueOf(padChar));
	}

	/**
	 * 문자열의 오른쪽에 해당 사이즈 만큼 문자열로 채운다.
	 * @param str 문자열
	 * @param size 사이즈
	 * @param padStr 채울 문자열
	 * @return 변환된 문자열
	 */
	public static String rPad(String str, int size, String padStr) {
		return strPad(str, size, padStr, false);
	}

	/**
	 * 문자열 ,시작자릿수 , 끝날자리수를 받아 문자열을 자른후 리턴한다
	 * @param input
	 * @param beginIndex
	 * @param endIndex
	 * @return
	 */
	public static String substring(String input, int beginIndex, int endIndex) {
		if (input == null)
			input = "";
		if (beginIndex >= input.length())
			return "";
		if (beginIndex < 0)
			beginIndex = 0;
		if (endIndex < 0 || endIndex > input.length())
			endIndex = input.length();
		if (endIndex < beginIndex)
			return "";
		return input.substring(beginIndex, endIndex);
	}

	/**
	 *
	 * 입력된 스트링을 지정된 길이만큼 Byte단위로 남기고 나머지를 잘라낸다.! <br>
	 * @param inputString 잘라내고자 하는 원본 문자열
	 * @param sz 자르고 남을 문자열의 byte단위 길이.
	 * @return 원본 문자열에서 자르고 남은 sz만큼의 문자열
	 * @throws UnsupportedEncodingException, CharacterCodingException
	 */

	public static String getByteCut(String inputString, int maxBytes) throws UnsupportedEncodingException, CharacterCodingException {
		String outputString="";
		final byte[] bytes = inputString.getBytes(StandardCharsets.UTF_8);

		final CharsetDecoder decoder = StandardCharsets.UTF_8.newDecoder();
		decoder.onMalformedInput(CodingErrorAction.IGNORE);
		decoder.reset();

		CharBuffer decoded = decoder.decode(ByteBuffer.wrap(bytes, 0, maxBytes));
		outputString = decoded.toString();

		return outputString;
	}

	/*
	public static String getByteCut(String str, int sz)
			throws UnsupportedEncodingException {
		str = ObjUtil.nvl(str, "");

		if (str.equals("") || str.getBytes().length <= sz) {
			return str;
		}

		String a = str;
		int i = 0;
		String imsi = "";
		String rlt = "";
		imsi = a.substring(0, 1);
		while (i < sz) {
			byte[] ar = imsi.getBytes();

			i += ar.length;

			rlt += imsi;
			a = a.substring(1);
			if (a.length() == 1) {
				imsi = a;
			} else if (a.length() > 1) {
				imsi = a.substring(0, 1);
			}
		}

		return rlt + "...";
	}*/

	/**
	 * 문자열을 대체한다
	 * @param source
	 * @param ch
	 * @param replace
	 * @return
	 */
	public static String replace(String source, char ch, String replace) {
		return replace(source, ch, replace, -1);
	}

	/**
	 * 문자열 대체함수
	 * @param source
	 * @param ch
	 * @param replace
	 * @param max
	 * @return
	 */
	public static String replace(String source, char ch, String replace, int max) {
		return replace(source, ch + "", replace, max);
	}

	/**
	 * 문자열 대체함수
	 * @param source
	 * @param ch
	 * @param replace
	 * @param max
	 * @return
	 */
	public static String replace(String source, String original, String replace) {
		return replace(source, original, replace, -1);
	}

	/**
	 * 문자열 대체함수
	 * @param source
	 * @param ch
	 * @param replace
	 * @param max
	 * @return
	 */
	public static String replace(String source, String original,
			String replace, int max) {
		if (null == source)
			return null;
		int nextPos = 0; //
		int currentPos = 0; //
		int len = original.length();
		StringBuilder result = new StringBuilder(source.length());
		while ((nextPos = source.indexOf(original, currentPos)) != -1) {
			result.append(source.substring(currentPos, nextPos));
			result.append(replace);
			currentPos = nextPos + len;
			if (--max == 0) {
				break;
			}
		}
		if (currentPos < source.length()) {
			result.append(source.substring(currentPos));
		}
		return result.toString();
	}

	/**
	 * 주어진 문자열(pattern)을 n번 반복하여 돌려줌
	 *
	 * @param pattern
	 * @param n
	 * @return
	 */
	public static String repeat(String pattern, int n) {
		if (null == pattern)
			return null;
		StringBuilder sb = new StringBuilder(n * pattern.length());
		repeat(sb, pattern, n);
		return sb.toString();
	}

	/**
	 * 문자열 반복함수
	 * @param sb
	 * @param pattern
	 * @param n
	 */
	private static void repeat(StringBuilder sb, String pattern, int n) {
		if (null == pattern)
			return;
		for (int i = 0; i < n; i++) {
			sb.append(pattern);
		}
	}

	/**
	 * 문자열과 문자열 배역을 받아 문자열 배열안에 문자열이 존재하면 0 존재하지 않으면 -1 을 리턴
	 * @param str
	 * @param strs
	 * @return
	 */
	public static int indexOf(String str, String[] strs) {
		if (null == str)
			return -1;
		int len = strs.length;
		int tmp = 0;
		int ret = Integer.MAX_VALUE;

		for (int i = 0; i < len; i++) {
			tmp = str.indexOf(strs[i]);
			if (tmp == -1) {
				continue;
			}
			if (tmp < ret) {
				ret = tmp;
				break;
			}
		}
		return (ret == Integer.MAX_VALUE ? -1 : ret);
	}

	/**
	 * 문자열과 문자열 배역을 받아 문자열 배열안에 문자열이 존재하면 0 존재하지 않으면 -1 을 리턴
	 * @param str
	 * @param strs
	 * @return
	 */
	public static int lastIndexOf(String str, String[] strs) {
		if (null == str)
			return -1;
		int len = strs.length;
		int ret = -1;
		int tmp = 0;
		for (int i = 0; i < len; i++) {
			tmp = str.lastIndexOf(strs[i]);
			if (tmp > ret) {
				ret = tmp;
			}
		}
		return ret;
	}

	/**
	 * 문자열 인자값을 전달받아 마지막 "." 이루 문자열을 리턴한다
	 * @param packageName
	 * @return
	 */
	public static String getLastValue(String packageName) {
		return packageName.substring(packageName.lastIndexOf('.') + 1);
	}

	/**
	 * deli로 구분된 문자열을 List<String>로 돌려줌
	 *
	 * @param source
	 * @param deli
	 * @return
	 */
	public static List<String> tokenizer(String source, String deli) {
		if (source == null)
			return null;
		if (deli == null)
			deli = " ";
		int idx = source.indexOf(deli);
		List<String> list = new ArrayList<String>();
		while (idx > -1) {
			String sub = source.substring(0, idx);
			source = source.substring(idx + 1);
			idx = source.indexOf(deli);
			list.add(sub);
		}
		list.add(source);
		return list;
		// String[] result = (String[]) list.toArray(new String[list.size()]);
		// return result;
	}

	/**
	 * HTML 문자열을 escape한다.
	 *
	 * @param s
	 * @return
	 */
	public static String htmlEscape(String s) {
		if (s == null) {
			s = "";
		} else {
			// s = s.replaceAll("&", "&amp;");
			// s = s.replaceAll("<", "&lt;");
			// s = s.replaceAll(">", "&gt;");
			// s = s.replaceAll("\"", "&quot;");
			// s = s.replaceAll("'", "&#39;");
			s = HtmlUtils.htmlEscape(s);
		}
		return s;
	}

	/**
	 * Turn special characters into escaped characters conforming to JavaScript.
	 * Handles complete character set defined in HTML 4.01 recommendation.
	 *
	 * @param input
	 *            the input string
	 * @return the escaped string
	 */
	public static String javaScriptEscape(String input) {
		if (input == null) {
			return input;
		}

		StringBuilder filtered = new StringBuilder(input.length());
		char prevChar = '\u0000';
		char c;
		for (int i = 0; i < input.length(); i++) {
			c = input.charAt(i);
			if (c == '"') {
				filtered.append("\\\"");
			} else if (c == '\'') {
				filtered.append("\\'");
			} else if (c == '\\') {
				filtered.append("\\\\");
			} else if (c == '/') {
				filtered.append("\\/");
			} else if (c == '\t') {
				filtered.append("\\t");
			} else if (c == '\n') {
				if (prevChar != '\r') {
					filtered.append("\\n");
				}
			} else if (c == '\r') {
				filtered.append("\\n");
			} else if (c == '\f') {
				filtered.append("\\f");
			} else {
				filtered.append(c);
			}
			prevChar = c;

		}
		return filtered.toString();
	}

	/**
	 * 모든 Object의 String 값을 가져온다.
	 *
	 * <pre>
	 *  null =&gt; null;
	 *  String =&gt; string.trim();
	 *  Collection =&gt; delimited by &quot;;&quot; string
	 *  Object -&gt; obj.toString();
	 * </pre>
	 *
	 * @author : 김상준
	 * @param obj
	 * @return
	 */
	@SuppressWarnings("rawtypes")
	public static String getSafeString(Object obj) {
		if (obj == null) {
			return null;
		} else if (obj instanceof String) {
			return String.valueOf(obj).trim();
			// return ((String) obj).v;
		} else if (obj instanceof Collections) {
			return StringUtils.collectionToDelimitedString((Collection) obj, ";");
			// return ((String) obj).v;
		} else {
			return obj.toString();
		}

	}

	/**
	 * TRUE나 T, Y, y의 경우 true로
	 *
	 * @param v
	 * @return
	 */
	public static boolean toBoolean(Object v) {
		if (v instanceof String) {
			if ("t".equalsIgnoreCase((String) v)
					|| "true".equalsIgnoreCase((String) v)
					|| "y".equalsIgnoreCase((String) v)
					|| "yes".equalsIgnoreCase((String) v)) {
				return true;
			} else {
				return false;
			}
		} else if (v instanceof Boolean) {
			return ((Boolean) v).booleanValue();
		} else {
			return false;
		}

	}

	/**
	 * Capitalize a <code>String</code>, changing the first letter to upper case
	 * as per {@link Character#toUpperCase(char)}. No other letters are lower.
	 *
	 * @param str
	 *            the String to capitalize, may be <code>null</code>
	 * @return the capitalized String, <code>null</code> if null
	 */
	public static String capitalize(String str) {
		if (str == null || str.length() == 0) {
			return str;
		}
		return changeFirstCharacterCase(str.toLowerCase(), true);
	}

	/**
	 * Uncapitalize a <code>String</code>, changing the first letter to lower
	 * case as per {@link Character#toLowerCase(char)}. No other letters are
	 * changed.
	 *
	 * @param str
	 *            the String to uncapitalize, may be <code>null</code>
	 * @return the uncapitalized String, <code>null</code> if null
	 */
	public static String uncapitalize(String str) {
		return changeFirstCharacterCase(str, false);
	}

	private static String changeFirstCharacterCase(String str,
			boolean capitalize) {
		if (str == null || str.length() == 0) {
			return str;
		}
		StringBuilder buf = new StringBuilder(str.length());
		if (capitalize) {
			buf.append(Character.toUpperCase(str.charAt(0)));
		} else {
			buf.append(Character.toLowerCase(str.charAt(0)));
		}
		buf.append(str.substring(1));
		return buf.toString();
	}

	/**
	 * 문자열을 대문자로 , null일 경우 def값을 리턴
	 *
	 * @param str
	 * @param def
	 * @return
	 */
	public static String toUpperCase(String str, String def) {
		if (str == null) {
			return def;
		} else {
			return str.toUpperCase();
		}
	}

	/**
	 * 문자열을 대문자로 , null일 경우 ""값을 리턴
	 *
	 * @param str
	 * @param def
	 * @return
	 */
	public static String toUpperCase(String str) {
		return toUpperCase(str, "");
	}

	/**
	 * 문자열을 소문자로 , null일 경우 def값을 리턴
	 *
	 * @param str
	 * @param def
	 * @return
	 */
	public static String toLowerCase(String str, String def) {
		if (str == null) {
			return def;
		} else {
			return str.toLowerCase();
		}
	}

	/**
	 * 문자열을 소문자로 , null일 경우 ""값을 리턴
	 *
	 * @param str
	 * @param def
	 * @return
	 */
	public static String toLowerCase(String str) {
		return toLowerCase(str, "");
	}

	/**
	 * multiplier번 반복한 input_str을 반환합니다. multiplier는 0 이상이여야 합니다. multiplier를
	 * 0으로 설정하면, 빈 문자열을 반환합니다.
	 */
	public static String strRepeat(String input, int multiplier) {
		StringBuilder sBuf = new StringBuilder();
		for (int i = 0; i < multiplier; i++) {
			sBuf.append(input);
		}
		return sBuf.toString();
	}

	public static String toCamelCase(String columnName) {
		return convert2CamelCase(columnName);
	}

	/**
	 * underscore ('_') 가 포함되어 있는 문자열을 Camel Case ( 낙타등
	 * 표기법 - 단어의 변경시에 대문자로 시작하는 형태. 시작은 소문자) 로 변환해주는
	 * utility 메서드 ('_' 가 나타나지 않고 첫문자가 대문자인 경우도 변환 처리
	 * 함.)
	 * @param underScore
	 *        - '_' 가 포함된 변수명
	 * @return Camel 표기법 변수명
	 */
	public static String convert2CamelCase(String underScore) {

		// '_' 가 나타나지 않으면 이미 camel case 로 가정함.
		// 단 첫째문자가 대문자이면 camel case 변환 (전체를 소문자로) 처리가
		// 필요하다고 가정함. --> 아래 로직을 수행하면 바뀜
		if (underScore.indexOf('_') < 0
				&& Character.isLowerCase(underScore.charAt(0) ) ) {
			return underScore;
		}
		StringBuilder result = new StringBuilder();
		boolean nextUpper = false;
		int len = underScore.length();

		for (int i = 0; i < len; i++) {
			char currentChar = underScore.charAt(i);
			if (currentChar =='_'  ) {
				nextUpper = true;
			} else {
				if (nextUpper) {
					result.append(Character.toUpperCase(currentChar));
					nextUpper = false;
				} else {
					result.append(Character.toLowerCase(currentChar));
				}
			}
		}
		return result.toString();
	}

	public static String toUnderscore(String camelcase) {
		String regex = "([a-z])([A-Z])";
		String replacement = "$1_$2";
		String value = "";

		if(null != camelcase) {
			value = camelcase.replaceAll(regex, replacement).toUpperCase();
		}

		return value;
	}

	/**
	 * get count of line seperator in string
	 * @param str
	 * @return
	 */
	public static int countLines(String str){
		if (str != null) {
			String[] lines = str.split("\r\n|\r|\n");
			return  lines.length;
		} else {
			return 0;
		}
	}

	/**
	 * null인 경우 ""를 return
	 * @param value
	 * @return
	 */
	public static String nvl(String value) {
		return nvl(value, "");
	}

	/**
	 *
	 * @param value
	 * @return
	 */
	public static int nvl(int value) {
		return nvl(value,0);
	}


	/**
	 * value가 null인 경우 defalult값을 return
	 * @param value
	 * @param defaultValue
	 * @return
	 */
	public static String nvl(String value, String defaultValue) {
		if (value == null || value.equals("") || value.equals("null"))
			return defaultValue;
		else
			return value;
	}

	/**
	 * value가 null인 경우 defalult값을 return
	 * @param value
	 * @param defaultValue
	 * @return
	 */
	public static int nvl(String value, int defaultValue) {
		if (value == null || value.equals("") || value.equals("null"))
			return defaultValue;
		else
			return Integer.parseInt(value);
	}


	/**
	 * null인 경우 ""를 return
	 * @param value
	 * @return
	 */
	public static String nvl(Object value) {
		return nvl(value, "");
	}

	/**
	 * value가 null인 경우 defalult값을 return
	 * @param value
	 * @param defaultValue
	 * @return
	 */
	public static String nvl(Object value, String defaultValue) {
		if (value == null || value.toString().equals("null")) {
			return defaultValue;
		}
		else {
			if (value.toString().equals(""))
				return defaultValue;
			else
				return value.toString();
		}

	}

	/**
	 * value가 null인 경우 defalult값을 return
	 * @param value
	 * @param defaultValue
	 * @return
	 */
	public static int nvl(Object value, int defaultValue) {
		if (value == null) {
			return defaultValue;
		}
		else {
			if (value.toString().equals(""))
				return defaultValue;
			else
				return Integer.parseInt(value.toString());
		}
	}

	/**
	 *
	 * @param str
	 * @param setstr
	 * @return String
	 * @throws Exception
	 */
	public static String isNull(final String str, final String setstr) {
		return isNull(str, setstr, null);
	}

	/**
	 * String 이 null 일경우 바꿀 대치할 문자열.
	 * @param str
	 * @param setstr String str 검사할 String
	 * @param setstr2 String setstr str 이 null 일 경우 리턴할 문자열
	 * @return 리턴 String
	 */
	public static String isNull(
			final String str,
			final String setstr,
			final String setstr2) {
		String result = null;

		if (str == null) {
			result = setstr;
		} else {
			if (setstr2 == null) {
				result = str;
			} else {
				result = setstr2;
			}
		}
		return result;
	}


	/**
	 * 구분자로 구분된 문자열과 문자열중에 존재여부를 확인하기위한 문자값을 넘겨 받아 해당 문자열이 존재 하는지를 체크 하는 함수
	 * @param source
	 * @param sepe_str
	 * @param compare
	 * @return
	 */
	public static boolean splitExistYn(String source, String sepe_str,String compare) {
		boolean result1					=	false;
		String[]	result				=	split(source,sepe_str);
		if("".equals(compare)) return false;

		for(int index = 0; index < result.length; index++) {
			if(nvl(result[index]).trim().equalsIgnoreCase(compare.trim())){
				result1	=	true;
				break;
			}
		}
		return	result1;
	}

	/**
	 *
	 * @param str
	 * @param sepe_str
	 * @return
	 */
	public static String[] split(String str, String sepe_str) {
		int		index				=	0;
		String[] result				=	new String[search(str,sepe_str)+1];
		String	strCheck			=	str;
		while (strCheck.length() != 0) {
			int		begin			=	strCheck.indexOf(sepe_str);
			if (begin == -1) {
				result[index]		=	strCheck;
				break;
			}
			else {
				int	end				=	begin + sepe_str.length();
				if(true) {
					result[index++]	=	strCheck.substring(0, begin);
				}
				strCheck			=	strCheck.substring(end);
				if(strCheck.length()==0) {
					result[index]	=	strCheck;
					break;
				}
			}
		}
		return result;
	}

	/**
	 *
	 * @param strTarget
	 * @param strSearch
	 * @return
	 */
	public static int search(String strTarget, String strSearch) {
		int		result				=	0;
		String	strCheck			=	new String(strTarget);
		for(int i = 0; i < strTarget.length();) {
			int		loc				=	strCheck.indexOf(strSearch);
			if(loc == -1) {
				break;
			}
			else {
				result++;
				i					=	loc + strSearch.length();
				strCheck			=	strCheck.substring(i);
			}
		}
		return result;
	}


	/**
	 * 문자형배열값을 받아 구분자로 구분된 문자열을 리턴한다
	 * @param str
	 * @param sepe_str
	 * @return
	 */
	public static String unSplit(String[] str) {
		return	unSplit(str,",");
	}

	/**
	 * 문자형배열값을 받아 구분자로 구분된 문자열을 리턴한다
	 * @param str
	 * @param sepe_str
	 * @return
	 */
	public static String unSplit(String[] str, String sepe_str) {
//		int index = 0;
		StringBuilder sb = new StringBuilder();
		if(str != null) {
			for (int i = 0 ; i < str.length; i ++ ) {
				if(i != str.length -1){
					sb.append(str[i] + sepe_str);
				} else {
					sb.append(str[i]);
				}
			}
		}
		return	sb.toString();
	}

	/**
	 * 구분자로 구분된 문자열을 받아 문자 리스트로 넘겨준다
	 * @param str
	 * @param sepe_str
	 * @return
	 */
	public static List<String> unSplitList(String[] str) {
		String	result = "";
		List<String> list = new ArrayList<>();

		if (str != null) {
			for (int i = 0 ; i < str.length; i ++ ) {
				result = str[i];
				list.add(result);
			}
		}

		return	list;
	}

	/**
	 * 랜덤 문자열을 리넡한다(패스워드 초기화)
	 * @param length
	 * @return
	 */
	public static String  getRandomString(int length){
		StringBuilder buffer = new StringBuilder();
		SecureRandom random = new SecureRandom();

		String chars[] = "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,1,2,3,4,5,6,7,8,9,0,!,@,#,$,%,^,&,(,),*".split(",");

		for (int i=0 ; i<length ; i++){
			buffer.append(chars[random.nextInt(chars.length)]);
		}
		return buffer.toString();
	}

	/**
	 * 문자열을 숫자로 바꿔준다.
	 * @param val
	 * @return
	 */
	public static double getValueNum(String val){
		if(val==null){
			return 0;
		}

		String retValue = val.equals("") ? "0" : val;
		retValue = retValue.replace(",","");

		return Double.parseDouble(retValue);
	}

	/**
	 * 숫자문자열에 콤마를 넣어준다.
	 *  12345678.1 --> 12,345,678.10         <BR>
	 */
	public static String amountFormater(String in) {
		Double amount = Double.parseDouble(in);
		NumberFormat nf = NumberFormat.getInstance();
		return nf.format(amount);
	}


	/**
	 * URL Encoding
	 * @param url
	 * @return
	 * @throws UnsupportedEncodingException
	 */
	public static String getUrlEncode(String url) throws UnsupportedEncodingException {
		if (url != null) {
			url = url.replace(" ", "*20");
			url = URLEncoder.encode(url, "UTF-8");
			url = url.replace('%','*');
		}
		return url;
	}


	/**
	 * URL Decoding
	 * @param url
	 * @return
	 * @throws UnsupportedEncodingException
	 */
	public static String getUrlDecode(String url) throws UnsupportedEncodingException {
		if (url != null) {
			url = url.replace('*','%');
			url = URLDecoder.decode(url, "UTF-8");
		}
		return url;
	}

	/**
	 * 문자열을 특정 크기로 만듬, 만약 남는 공간이 있으면 왼쪽에서부터 특정문자(cSpace)를 채움<BR>
	 * null이 입력되더라도 크기 만큼 특정문자를 채움
	 * @param strText String 문자열
	 * @param cSpace char 빈공란에 채울 특정문자
	 * @param iTotalSize int 특정 크기
	 * @return 변경된 문자열
	 */
	public static String fixTextSize(String strText, char cSpace, int iTotalSize) {

		if(strText == null) {
			strText = "";
		}

		if(strText.length() < iTotalSize) {

			// 문자열의 크기가 특정크기보다 작을 때는 특정문자로 채움
			char[] carraySpace = new char[iTotalSize - strText.length()];
			Arrays.fill(carraySpace, cSpace);
			String strSpace = new String(carraySpace);

			return strSpace + strText;
		} else {
			// 문자열의 크기가 특정크기보다 클때는 앞쪽의 문자열 잘라냄
			return strText.substring(strText.length() - iTotalSize, strText.length());

		}
	}

	/**
	 * 한자리 숫자형을 두자리 숫자 문자형으로 리턴 (0 ~ 9 까지 2자리 문자형으로 리턴)
	 * @param num
	 * @return
	 */
	public static String getNumToTwoString(int num) {
		String str = "";
		if (num >= 0 && num < 10) {
			str = "0" + Integer.toString(num);
		} else {
			str = Integer.toString(num);
		}
		return str;
	}


	/**
	 * toDB() 메소드를 이용하여 DB에 저장되어진 데이타를 WEB상에 input box나 textarea에 뿌릴때 전환
	 * @param str
	 * @return String str
	 */
	public static String toWEB_BOX(String str){
		if (str == null) {
			return null;
		}
		str = str.replace("<br>", "\r\n");
		str = str.replace("&amp;", "&&");
		str = str.replace("&lt;", "<");
		str = str.replace("&gt;", ">");
		str = str.replace("&quot;", "\\\"");
		str = str.replace("&#039;", "\\\'");
		str = str.replace("&#092;", "\\\\");
		return str;
	}

	/**
	 * WEB상에서 받아들인 문자열의 특수기호 처리
	 *  @param str
	 * @return String str
	 **/
	public static String toWEB(String str) {
		if ( str == null ) {
			return null;
		}

		StringBuilder buf = new StringBuilder();
		char[] c = str.toCharArray();
		int len = c.length;
		for (int i = 0; i < len; i++) {
			if      ( c[i] == '&' ) buf.append("&amp;");
			else if ( c[i] == '<' ) buf.append("&lt;");
			else if ( c[i] == '>' ) buf.append("&gt;");
			else if ( c[i] == '"' ) buf.append("&quot;");
			else if ( c[i] == '\'') buf.append("&#039;");
			else if ( c[i] == '\\') buf.append("&#092;");
			else if ( c[i] == '\n') buf.append("<br>");
			else buf.append(c[i]);
		}

		return buf.toString();

	}
}
