import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const register = async () => {
    if (!name || !email || !password || !confirm) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    if (password !== confirm) {
      Alert.alert('Thông báo', 'Mật khẩu nhập lại không khớp.');
      return;
    }

    await AsyncStorage.setItem('user_name', name.trim());
    await AsyncStorage.setItem('user_email', email.trim());
    await AsyncStorage.setItem('user_password', password);
    await AsyncStorage.setItem('logged_in', 'true');

    router.replace('/home');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </Pressable>

        <Text style={styles.title}>
          Tạo tài khoản mới ✨
        </Text>

        <Text style={styles.subtitle}>
          Đăng ký để bắt đầu quản lý deadline
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Họ và tên"
          placeholderTextColor="#7FAF9F"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Nhập email của bạn"
          placeholderTextColor="#7FAF9F"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Nhập mật khẩu"
          placeholderTextColor="#7FAF9F"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Nhập lại mật khẩu"
          placeholderTextColor="#7FAF9F"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        <Pressable
          style={styles.button}
          onPress={register}
        >
          <Text style={styles.buttonText}>
            Đăng ký
          </Text>
        </Pressable>

        <View style={styles.loginRow}>
          <Text style={styles.gray}>
            Đã có tài khoản?{' '}
          </Text>

          <Pressable onPress={() => router.replace('/explore')}>
            <Text style={styles.green}>
              Đăng nhập
            </Text>
          </Pressable>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FBF8',
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 32,
  },

  back: {
    fontSize: 28,
    color: '#245747',
    marginBottom: 8,
  },

  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#245747',
  },

  subtitle: {
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 32,
    fontSize: 12,
    color: '#65AA96',
  },

  input: {
    height: 42,
    borderWidth: 1,
    borderColor: '#B9E5D5',
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    paddingHorizontal: 16,
    marginBottom: 13,
    color: '#245747',
  },

  button: {
    height: 42,
    backgroundColor: '#35B979',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },

  gray: {
    color: '#84928E',
    fontSize: 11,
  },

  green: {
    color: '#20A96D',
    fontSize: 11,
    fontWeight: '600',
  },
});