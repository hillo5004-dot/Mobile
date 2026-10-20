import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function ResetPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const resetPassword = async () => {
    const savedEmail = await AsyncStorage.getItem('user_email');

    if (!email || !password || !confirm) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    if (savedEmail && email !== savedEmail) {
      Alert.alert('Thông báo', 'Email không tồn tại.');
      return;
    }

    if (password !== confirm) {
      Alert.alert('Thông báo', 'Mật khẩu nhập lại không khớp.');
      return;
    }

    await AsyncStorage.setItem('user_password', password);
    await AsyncStorage.setItem('logged_in', 'true');

    Alert.alert(
      'Thành công',
      'Mật khẩu đã được cập nhật.',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/home'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>

      <View style={styles.content}>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </Pressable>

        <Text style={styles.title}>
          Đặt lại mật khẩu
        </Text>

        <Text style={styles.subtitle}>
          Nhập thông tin để tạo mật khẩu mới
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nhập email của bạn"
          placeholderTextColor="#7FAF9F"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Mật khẩu mới"
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
          onPress={resetPassword}
        >
          <Text style={styles.buttonText}>
            Đăng ký lại
          </Text>
        </Pressable>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FBF8',
  },

  content: {
    padding: 24,
    paddingTop: 35,
  },

  back: {
    fontSize: 28,
    color: '#245747',
    marginBottom: 15,
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
    marginBottom: 30,
    color: '#65AA96',
    fontSize: 12,
  },

  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#B9E5D5',
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 13,
  },

  button: {
    height: 44,
    backgroundColor: '#35B979',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});