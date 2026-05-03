import { Text, View, TextInput } from 'react-native';
import theme from '../../data/color-theme';
import AnimatedIconButton from '../../components/AnimatedIconButton';
import { Plus, Search } from 'lucide-react-native';

type Props = {
  onAddTaskPress: () => void;
  currentTab: string;
  onTabChange: (tab: string) => void;
  todoCount: number;
  inProgressCount: number;
  completedCount: number;
  totalCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export default function HeaderTaskScreen({
  onAddTaskPress,
  currentTab,
  onTabChange,
  todoCount,
  inProgressCount,
  completedCount,
  totalCount,
  searchQuery,
  onSearchChange,
}: Props) {
  return (
    <View
      style={{
        paddingHorizontal: theme.padding.paddingMainX,
        paddingTop: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: theme.text + '10',
          paddingBottom: 16,
        }}
      >
        <View
          style={{
            gap: 2,
            flexDirection: 'column',
          }}
        >
          <Text
            style={{
              fontSize: 20,
              color: theme.text,
              fontFamily: theme.fonts[700],
            }}
          >
            Tasks
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.text + '90',
              fontFamily: theme.fonts[400],
            }}
          >
            {String(totalCount).padStart(2, '0')} tasks
          </Text>
        </View>
        <View>
          <AnimatedIconButton
            onPress={onAddTaskPress}
            style={{
              backgroundColor: theme.primary[13],
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              // paddingVertical: 12,
              // paddingHorizontal: 14,
              width: 50,
              height: 50,
              justifyContent: 'center',
              padding: 9,

              borderRadius: 15,
            }}
          >
            <Plus size={24} />
            {/* <Text style={{
                            fontSize: 15,
                            fontFamily: theme.fonts[500],
                        }}>Add Task</Text> */}
          </AnimatedIconButton>
        </View>
      </View>

      {/* ── Search Bar ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.white + '08',
          borderRadius: theme.border.radius.main,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginTop: 16,
          gap: 12,
        }}
      >
        <Search size={20} color={theme.text + '50'} />
        <TextInput
          style={{
            flex: 1,
            color: theme.text,
            fontFamily: theme.fonts[500],
            fontSize: 16,
            padding: 0, // Removes default Android padding
          }}
          placeholder="Search tasks by title..."
          placeholderTextColor={theme.text + '50'}
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      {/* ── Tabs ── */}
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          marginTop: 16,
          marginBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.text + '10',
          paddingBottom: 12,
        }}
      >
        {[
          {
            label: 'To do',
            value: 'to-do',
            valueCount: todoCount,
          },
          {
            label: 'In Progress',
            value: 'in-progress',
            valueCount: inProgressCount,
          },
          {
            label: 'Completed',
            value: 'completed',
            valueCount: completedCount,
          },
        ].map((item, index) => {
          return (
            <AnimatedIconButton
              key={index}
              onPress={() => onTabChange(item.value)}
              style={{
                backgroundColor:
                  currentTab === item.value ? theme.primary[13] : theme.white + '10',
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: theme.border.radius.main,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text
                style={{
                  color:
                    currentTab === item.value
                      ? theme.background
                      : theme.text + '90',
                  fontFamily: theme.fonts[500],
                }}
              >
                {item.label}
              </Text>
              {currentTab !== item.value && (
                <View
                  style={{
                    backgroundColor: theme.white + '10',
                    borderRadius: theme.border.radius.main,
                    width: 24,
                    height: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color:
                        currentTab === item.value
                          ? theme.background
                          : theme.text + '90',
                      fontFamily: theme.fonts[500],
                    }}
                  >
                    {item.valueCount}
                  </Text>
                </View>
              )}
            </AnimatedIconButton>
          );
        })}
      </View>
    </View>
  );
}
