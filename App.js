//app.js
import { enableScreens } from 'react-native-screens';
enableScreens(); // enable native screen optimization
import { useEffect, useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { SafeAreaProvider } from "react-native-safe-area-context"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { auth } from "./firebase-config"
import { onAuthStateChanged } from "firebase/auth"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

// Import screens
import IntroSlides from "./screens/IntroSlides"
import Login from "./screens/Login"
import SignUp from "./screens/SignUp"
import ReservoirForm from "./screens/ReservoirForm"
import Dashboard from "./screens/Dashboard"
import History from "./screens/History"
import Alerts from "./screens/Alerts"
import MapScreen from "./screens/MapScreen"
import Profile from "./screens/Profile"
import ForgotPassword from "./screens/ForgotPassword"

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Dashboard") {
            iconName = "view-dashboard"
          } else if (route.name === "History") {
            iconName = "chart-line"
          } else if (route.name === "Alerts") {
            iconName = "bell"
          } else if (route.name === "Map") {
            iconName = "map"
          } else if (route.name === "Profile") {
            iconName = "account"
          }

          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#3498DB",
        tabBarInactiveTintColor: "#95a5a6",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="History" component={History} />
      <Tab.Screen name="Alerts" component={Alerts} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [initializing, setInitializing] = useState(true)
  const [user, setUser] = useState(null)
  const [firstLaunch, setFirstLaunch] = useState(null)
  const [hasReservoir, setHasReservoir] = useState(false)

  useEffect(() => {
    console.log("App useEffect: initializing start")
    const subscriber = onAuthStateChanged(auth, (user) => {
      console.log("onAuthStateChanged user:", user)
      setUser(user)
      if (user) {
        checkReservoirData(user.uid)
      }
      if (initializing) setInitializing(false)
    })
    checkFirstLaunch()
    return () => {
      console.log("App useEffect cleanup")
      subscriber()
    }
  }, [])

  const checkFirstLaunch = async () => {
    try {
      console.log("Checking first launch")
      const value = await AsyncStorage.getItem("alreadyLaunched")
      console.log("alreadyLaunched value:", value)
      if (value === null) {
        await AsyncStorage.setItem("alreadyLaunched", "true")
        setFirstLaunch(true)
      } else {
        setFirstLaunch(false)
      }
    } catch (error) {
      console.error("Error checking first launch:", error)
      setFirstLaunch(false)
    }
  }

  const checkReservoirData = async (userId) => {
    try {
      console.log("Checking reservoir data for user:", userId)
      const reservoirData = await AsyncStorage.getItem(`reservoirData_${userId}`)
      console.log("Reservoir data:", reservoirData)
      setHasReservoir(reservoirData !== null)
    } catch (error) {
      console.error("Error checking reservoir data:", error)
      setHasReservoir(false)
    }
  }

  console.log("App render: initializing =", initializing, "firstLaunch =", firstLaunch)

  if (initializing || firstLaunch === null) {
    return null
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={
            firstLaunch ? "Intro" :
            user ? (hasReservoir ? "Main" : "ReservoirForm") :
            "Login"
          }
        >
          <Stack.Screen name="Intro" component={IntroSlides} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="ReservoirForm">
            {(props) => (
              <ReservoirForm {...props} setHasReservoir={setHasReservoir} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Main" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>

    </SafeAreaProvider>
  )
}
