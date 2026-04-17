import { StyleProp, Text, TextStyle } from 'react-native';

type HighlightedSearchTextProps = {
  value: string;
  color: string;
  style?: StyleProp<TextStyle>;
};

const BLUE_EMPHASIS_COLOR = '#2563EB';
const EM_TAG_REGEX = /<\/?em>/gi;
const EM_CHUNK_REGEX = /(<em>.*?<\/em>)/gi;
const IS_EM_CHUNK_REGEX = /^<em>.*<\/em>$/i;

export function HighlightedSearchText({ value, color, style }: HighlightedSearchTextProps) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }

  return (
    <Text style={style}>
      {normalizedValue
        .split(EM_CHUNK_REGEX)
        .filter(Boolean)
        .map((part, index) => {
          const isEm = IS_EM_CHUNK_REGEX.test(part);
          const cleanPart = part.replace(EM_TAG_REGEX, '');

          return (
            <Text key={`${index}-${cleanPart}`} style={{ color: isEm ? BLUE_EMPHASIS_COLOR : color, fontWeight: isEm ? '700' : '500' }}>
              {cleanPart}
            </Text>
          );
        })}
    </Text>
  );
}
