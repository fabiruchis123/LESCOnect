import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import { colors } from '../theme/colors';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  helper,
  iconLeft,
  iconRight,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}>
        {iconLeft ? <View style={styles.iconLeft}>{iconLeft}</View> : null}

        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor="#7A6E5C"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B241C',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EAE0D0',
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputFocused: {
    borderColor: '#B5551A',
  },
  inputError: {
    borderColor: '#C0392B',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2B241C',
    paddingVertical: 10,
    fontWeight: '500',
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#C0392B',
    marginTop: 4,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#7A6E5C',
    marginTop: 4,
  },
});
