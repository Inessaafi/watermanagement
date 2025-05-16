import { useState, useRef } from "react"
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, SafeAreaView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Animated, {useSharedValue,useAnimatedScrollHandler,useAnimatedStyle,interpolate,} from "react-native-reanimated"

const { width, height } = Dimensions.get("window")

const slides = [
  {
    id: "1",
    title: "Bienvenue",
    description:
      "Découvrez notre application de gestion intelligente de l'eau pour surveiller et optimiser votre consommation.",
    image: require("../assets/intro1.png"),
  },
  {
    id: "2",
    title: "Surveillance intelligente",
    description:
      "Visualisez les données de vos capteurs en temps réel pour une gestion optimale de votre réservoir d'eau.",
    image: require("../assets/intro2.png"),
  },
  {
    id: "3",
    title: "Alerte proactive",
    description: "Recevez des notifications instantanées en cas de valeurs anormales pour agir rapidement.",
    image: require("../assets/intro3.png"),
  },
  {
    id: "4",
    title: "Historique et analyse",
    description: "Suivez l'évolution de la qualité de votre eau sur le long terme grâce à des graphiques détaillés.",
    image: require("../assets/intro4.png"),
  },
  {
    id: "5",
    title: "Configuration personnalisée",
    description: "Configurez votre réservoir selon vos besoins spécifiques pour une expérience sur mesure.",
    image: require("../assets/intro5.png"),
  },
]

const IntroSlides = () => {
  const navigation = useNavigation()
  const scrollX = useSharedValue(0)
  const flatListRef = useRef(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x
    },
  })

  const onViewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index)
    }
  }

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  }

  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        <Image source={item.image} style={styles.image} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    )
  }

  const Indicator = () => {
    return (
      <View style={styles.indicatorContainer}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width]

          // Move useAnimatedStyle outside the map function
          return <Dot scrollX={scrollX} i={i} inputRange={inputRange} key={`indicator-${i}`} />
        })}
      </View>
    )
  }

  const Dot = ({ scrollX, i, inputRange }) => {
    const animatedDotStyle = useAnimatedStyle(() => {
      const dotWidth = interpolate(scrollX.value, inputRange, [8, 16, 8], "clamp")

      const opacity = interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], "clamp")

      return {
        width: dotWidth,
        opacity,
      }
    })

    return <Animated.View style={[styles.dot, animatedDotStyle]} />
  }

  const setAlreadyLaunched = async () => {
    try {
      await AsyncStorage.setItem("alreadyLaunched", "true")
    } catch (error) {
      console.error("Error setting alreadyLaunched in AsyncStorage:", error)
    }
  }

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      })
    } else {
      await setAlreadyLaunched()
      navigation.navigate("Login")
    }
  }

  const handleSkip = async () => {
    await setAlreadyLaunched()
    navigation.navigate("Login")
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <Indicator />

      <View style={styles.buttonContainer}>
        {currentIndex < slides.length - 1 ? (
          <>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Passer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <Text style={styles.nextButtonText}>Suivant</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={handleNext} style={styles.startButton}>
            <Text style={styles.startButtonText}>Commencer</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  slide: {
    width,
    height,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    resizeMode: "contain",
  },
  textContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3498DB",
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  skipButton: {
    padding: 15,
  },
  skipButtonText: {
    fontSize: 16,
    color: "#7F8C8D",
  },
  nextButton: {
    backgroundColor: "#3498DB",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  nextButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  startButton: {
    backgroundColor: "#3498DB",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    flex: 1,
  },
  startButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
})

export default IntroSlides
