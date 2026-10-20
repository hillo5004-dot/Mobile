
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Deadline = {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  priority: string;
  reminder: string;
  completed: boolean;
};

const STORAGE_KEY = 'deadlines';

export default function DeadlinesScreen() {
  const router = useRouter();

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tất cả');

  const [editing, setEditing] = useState<Deadline | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('18:00');
  const [editCategory, setEditCategory] = useState('');
  const [editPriority, setEditPriority] = useState('Cao');
  const [editReminder, setEditReminder] = useState('');

  const loadDeadlines = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const list: Deadline[] = data ? JSON.parse(data) : [];
      setDeadlines(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Lỗi đọc deadline:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách deadline.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDeadlines();
    }, [loadDeadlines])
  );

  // Lưu danh sách mới xuống bộ nhớ.
  const saveList = async (list: Deadline[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      setDeadlines(list);
      return true;
    } catch (error) {
      console.error('Lỗi lưu deadline:', error);
      Alert.alert('Lỗi', 'Không thể lưu thay đổi.');
      return false;
    }
  };

  // Đánh dấu hoàn thành hoặc bỏ hoàn thành.
  const toggleCompleted = async (id: string) => {
    const target = deadlines.find(item => item.id === id);
    if (!target) return;

    const nextCompleted = !target.completed;

    const updated = deadlines.map(item =>
      item.id === id
        ? { ...item, completed: nextCompleted }
        : item
    );

    const success = await saveList(updated);

    if (success) {
      Alert.alert(
        'Thành công',
        nextCompleted
          ? 'Đã đánh dấu deadline hoàn thành.'
          : 'Đã chuyển deadline về chưa hoàn thành.'
      );
    }
  };

  // Xóa deadline sau khi xác nhận.
  const deleteDeadline = (id: string) => {
    const target = deadlines.find(item => item.id === id);
    if (!target) return;

    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa "${target.title}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const updated = deadlines.filter(item => item.id !== id);
            await saveList(updated);
          },
        },
      ]
    );
  };

  // Mở cửa sổ sửa với dữ liệu deadline hiện tại.
  const editDeadline = (item: Deadline) => {
    setEditing(item);
    setEditTitle(item.title);
    setEditDate(item.date);
    setEditTime(item.time || '18:00');
    setEditCategory(item.category || 'Cá nhân');
    setEditPriority(item.priority || 'Cao');
    setEditReminder(item.reminder || 'Không');
  };

  const saveEditedDeadline = async () => {
    if (!editing) return;

    if (!editTitle.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên deadline.');
      return;
    }

    const dateMatch = editDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!dateMatch) {
      Alert.alert(
        'Thông báo',
        'Ngày hạn phải có dạng YYYY-MM-DD, ví dụ 2026-10-25.'
      );
      return;
    }

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const checkDate = new Date(Date.UTC(year, month - 1, day));

    if (
      checkDate.getUTCFullYear() !== year ||
      checkDate.getUTCMonth() !== month - 1 ||
      checkDate.getUTCDate() !== day
    ) {
      Alert.alert('Thông báo', 'Ngày hạn không hợp lệ.');
      return;
    }

    const updated = deadlines.map(item =>
      item.id === editing.id
        ? {
            ...item,
            title: editTitle.trim(),
            date: editDate,
            time: editTime.trim() || '18:00',
            category: editCategory.trim() || 'Cá nhân',
            priority: editPriority,
            reminder: editReminder.trim() || 'Không',
          }
        : item
    );

    const success = await saveList(updated);

    if (success) {
      setEditing(null);
      Alert.alert('Thành công', 'Đã cập nhật deadline.');
    }
  };

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  const filtered = deadlines
    .filter(item => {
      const matchSearch = item.title
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      if (!matchSearch) return false;

      if (filter === 'Sắp tới') {
        return !item.completed && item.date >= todayString;
      }

      if (filter === 'Đã hoàn thành') {
        return item.completed;
      }

      return true;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      return a.date.localeCompare(b.date) ||
        a.time.localeCompare(b.time);
    });

  // Khi chọn "Tất cả", chia danh sách thành hai nhóm riêng.
  const pendingDeadlines = filtered.filter(item => !item.completed);
  const completedDeadlines = filtered.filter(item => item.completed);

  const renderDeadline = ({ item }: { item: Deadline }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text
          style={[
            styles.deadlineTitle,
            item.completed && styles.completedTitle,
          ]}
        >
          {item.title}
        </Text>

        <Text
          style={[
            styles.priority,
            item.priority === 'Cao'
              ? styles.highPriority
              : item.priority === 'Thấp'
                ? styles.lowPriority
                : styles.mediumPriority,
          ]}
        >
          {item.priority}
        </Text>
      </View>

      <Text style={styles.category}>
        {item.category || 'Cá nhân'}
      </Text>

      <View style={styles.infoRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.date}>
            Hạn: {formatDate(item.date)}
          </Text>

          <Text style={styles.reminder}>
            Nhắc: {item.reminder || 'Không'}
          </Text>
        </View>

        <View style={styles.rightInfo}>
          <Text style={styles.time}>
            {item.time || '18:00'}
          </Text>

          <Text
            style={[
              styles.status,
              item.completed && styles.completedStatus,
            ]}
          >
            {item.completed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[
            styles.actionButton,
            item.completed
              ? styles.undoButton
              : styles.completeButton,
          ]}
          onPress={() => toggleCompleted(item.id)}
        >
          <Text
            style={[
              styles.actionText,
              item.completed
                ? styles.undoText
                : styles.completeText,
            ]}
          >
            {item.completed
              ? '↩ Bỏ hoàn thành'
              : '✓ Đánh dấu hoàn thành'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.editButton]}
          onPress={() => editDeadline(item)}
        >
          <Text style={[styles.actionText, styles.editText]}>
            ✎ Sửa
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteDeadline(item.id)}
        >
          <Text style={[styles.actionText, styles.deleteText]}>
            Xóa
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Danh sách deadline</Text>
          <Text style={styles.subtitle}>
            Theo dõi và quản lý các deadline của bạn
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/add-deadline')}
          hitSlop={12}
        >
          <Text style={styles.plus}>+</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Tìm kiếm deadline..."
        placeholderTextColor="#7FAF9F"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filters}>
        {['Tất cả', 'Sắp tới', 'Đã hoàn thành'].map(item => (
          <Pressable
            key={item}
            style={[
              styles.filterButton,
              filter === item && styles.filterActive,
            ]}
            onPress={() => setFilter(item)}
          >
            <Text
              style={[
                styles.filterText,
                filter === item && styles.filterTextActive,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        style={styles.list}
        // Tất cả: hiển thị hai nhóm trong ListHeaderComponent để không bị lặp.
        // Các bộ lọc khác: dùng renderItem bình thường.
        data={filter === 'Tất cả' ? [] : filtered}
        keyExtractor={item => item.id}
        renderItem={renderDeadline}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          filter === 'Tất cả' ? (
            <View>
              <Text style={styles.sectionTitle}>
                Chưa hoàn thành ({pendingDeadlines.length})
              </Text>

              {pendingDeadlines.length > 0 ? (
                pendingDeadlines.map(item => (
                  <View key={item.id}>
                    {renderDeadline({ item })}
                  </View>
                ))
              ) : (
                <Text style={styles.sectionEmpty}>
                  Không có deadline nào chưa hoàn thành.
                </Text>
              )}

              <Text style={styles.sectionTitle}>
                Đã hoàn thành ({completedDeadlines.length})
              </Text>

              {completedDeadlines.length > 0 ? (
                completedDeadlines.map(item => (
                  <View key={item.id}>
                    {renderDeadline({ item })}
                  </View>
                ))
              ) : (
                <Text style={styles.sectionEmpty}>
                  Chưa có deadline nào hoàn thành.
                </Text>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          filter !== 'Tất cả' ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {filter === 'Sắp tới'
                  ? 'Không có deadline chưa hoàn thành sắp tới.'
                  : deadlines.length === 0
                    ? 'Chưa có deadline nào. Nhấn + để thêm mới.'
                    : 'Chưa có deadline nào hoàn thành phù hợp.'}
              </Text>
            </View>
          ) : null
        }
      />

      <View style={styles.bottomNav}>
        <Pressable onPress={() => router.push('/home')}>
          <Text style={styles.navIcon}>⌂</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/deadlines')}>
          <Text style={styles.navIcon}>☰</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/add-deadline')}>
          <Text style={styles.navIcon}>⊞</Text>
        </Pressable>

        <Pressable
          onPress={() => Alert.alert('Tài khoản', 'Bạn đang sử dụng Deadline Buddy.')}
        >
          <Text style={styles.navIcon}>♙</Text>
        </Pressable>
      </View>

      {/* Cửa sổ chỉnh sửa deadline */}
      <Modal
        visible={editing !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chỉnh sửa deadline</Text>

            <Text style={styles.label}>Tên deadline</Text>
            <TextInput
              style={styles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Tên deadline"
              placeholderTextColor="#7FAF9F"
            />

            <Text style={styles.label}>Ngày hạn (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={editDate}
              onChangeText={setEditDate}
              placeholder="2026-10-25"
              placeholderTextColor="#7FAF9F"
            />

            <Text style={styles.label}>Giờ đến hạn</Text>
            <TextInput
              style={styles.input}
              value={editTime}
              onChangeText={setEditTime}
              placeholder="18:00"
              placeholderTextColor="#7FAF9F"
            />

            <Text style={styles.label}>Danh mục</Text>
            <TextInput
              style={styles.input}
              value={editCategory}
              onChangeText={setEditCategory}
              placeholder="Cá nhân"
              placeholderTextColor="#7FAF9F"
            />

            <Text style={styles.label}>Mức ưu tiên</Text>
            <View style={styles.priorityRow}>
              {['Cao', 'Trung bình', 'Thấp'].map(value => (
                <Pressable
                  key={value}
                  style={[
                    styles.priorityButton,
                    editPriority === value && styles.priorityActive,
                  ]}
                  onPress={() => setEditPriority(value)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      editPriority === value && styles.priorityButtonTextActive,
                    ]}
                  >
                    {value}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Nhắc nhở</Text>
            <TextInput
              style={styles.input}
              value={editReminder}
              onChangeText={setEditReminder}
              placeholder="Ví dụ: 10 phút trước"
              placeholderTextColor="#7FAF9F"
            />

            <Pressable
              style={styles.saveButton}
              onPress={saveEditedDeadline}
            >
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setEditing(null)}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatDate(date: string) {
  const parts = date.split('-');

  if (parts.length !== 3) return date;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FBF8',
  },

  headerRow: {
    paddingHorizontal: 18,
    paddingTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 23,
    fontWeight: '700',
    color: '#245747',
  },

  subtitle: {
    marginTop: 4,
    color: '#65AA96',
    fontSize: 11,
  },

  plus: {
    color: '#318E68',
    fontSize: 30,
    fontWeight: '400',
  },

  search: {
    marginHorizontal: 18,
    marginTop: 18,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B9E5D5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    color: '#31594C',
  },

  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    marginTop: 10,
    gap: 8,
  },

  filterButton: {
    paddingHorizontal: 17,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },

  filterActive: {
    backgroundColor: '#35B979',
  },

  filterText: {
    fontSize: 10,
    color: '#568878',
  },

  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  list: {
    flex: 1,
    marginTop: 4,
  },

  listContent: {
    paddingHorizontal: 17,
    paddingBottom: 25,
    flexGrow: 1,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#245747',
    marginTop: 18,
    marginBottom: 2,
    paddingHorizontal: 1,
  },

  sectionEmpty: {
    color: '#8A9692',
    fontSize: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    marginTop: 8,
    textAlign: 'center',
  },

  card: {
    marginTop: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDF5F0',
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },

  deadlineTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#31594C',
  },

  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#8A9692',
  },

  priority: {
    fontSize: 10,
  },

  highPriority: {
    color: '#E53935',
  },

  mediumPriority: {
    color: '#4787D8',
  },

  lowPriority: {
    color: '#8BC34A',
  },

  category: {
    color: '#8A9692',
    fontSize: 11,
    marginTop: 5,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 12,
  },

  rightInfo: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },

  date: {
    color: '#55A083',
    fontSize: 11,
  },

  reminder: {
    color: '#8A9692',
    fontSize: 10,
    marginTop: 5,
  },

  time: {
    color: '#66756F',
    fontSize: 11,
  },

  status: {
    color: '#7B8581',
    fontSize: 10,
    marginTop: 6,
  },

  completedStatus: {
    color: '#219563',
    fontWeight: '600',
  },

  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF5F1',
  },

  actionButton: {
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 8,
  },

  actionText: {
    fontSize: 11,
    fontWeight: '600',
  },

  completeButton: {
    backgroundColor: '#DDF6E8',
  },

  completeText: {
    color: '#20794F',
  },

  undoButton: {
    backgroundColor: '#F0F2F1',
  },

  undoText: {
    color: '#52665D',
  },

  editButton: {
    backgroundColor: '#EAF2FF',
  },

  editText: {
    color: '#386FC1',
  },

  deleteButton: {
    backgroundColor: '#FFF0EE',
  },

  deleteText: {
    color: '#D84336',
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 50,
  },

  emptyText: {
    color: '#8A9692',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 20,
  },

  bottomNav: {
    height: 58,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5EEE9',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  navIcon: {
    fontSize: 25,
    color: '#4D9D7D',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },

  modalCard: {
    backgroundColor: '#F4FBF8',
    borderRadius: 16,
    padding: 20,
    maxHeight: '100%',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#245747',
    marginBottom: 14,
  },

  label: {
    fontSize: 11,
    color: '#31594C',
    marginBottom: 5,
    marginTop: 5,
  },

  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#B9E5D5',
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    color: '#31594C',
    marginBottom: 6,
  },

  priorityRow: {
    flexDirection: 'row',
    gap: 7,
    marginVertical: 7,
  },

  priorityButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },

  priorityActive: {
    backgroundColor: '#35B979',
  },

  priorityButtonText: {
    color: '#568878',
    fontSize: 10,
  },

  priorityButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  saveButton: {
    height: 43,
    backgroundColor: '#35B979',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  cancelButtonText: {
    color: '#568878',
    fontWeight: '600',
  },
});
