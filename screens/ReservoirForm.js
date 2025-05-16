"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native"
import { TextInput, Button, Text, Snackbar, HelperText, RadioButton, Divider } from "react-native-paper"
import { Picker } from "@react-native-picker/picker"
import * as Location from "expo-location"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getFirestore, collection, addDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const ReservoirForm = ({ navigation }) => {
  const [name, setName] = useState("")
  const [type, setType] = useState("Domestic")
  const [shape, setShape] = useState("Rectangular")
  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const [diameter, setDiameter] = useState("")
  const [criticalDepth, setCriticalDepth] = useState("")
  const [locationType, setLocationType] = useState("gps")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [errors, setErrors] = useState({})

  const auth = getAuth()
  const db = getFirestore()

  const usageTypes = ["Domestic", "Agricultural", "Industrial", "Commercial", "Other"]
  const shapeTypes = ["Rectangular", "Cylindrical", "Other"]

  useEffect(() => {
    if (locationType === "gps") {
      getLocation()
    }
  }, [locationType])

  const getLocation = async () => {
    setLocationLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        setSnackbarMessage("Permission to access location was denied")
        setSnackbarVisible(true)
        setLocationType("manual")
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      setLatitude(location.coords.latitude.toString())
      setLongitude(location.coords.longitude.toString())
    } catch (error) {
      console.log("Error getting location:", error)
      setSnackbarMessage("Failed to get location. Please enter manually.")
      setSnackbarVisible(true)
      setLocationType("manual")
    } finally {
      setLocationLoading(false)
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!name.trim()) newErrors.name = "Reservoir name is required"
    if (!criticalDepth.trim()) newErrors.criticalDepth = "Critical minimum depth is required"
    else if (isNaN(Number.parseFloat(criticalDepth)) || Number.parseFloat(criticalDepth) <= 0) {
      newErrors.criticalDepth = "Critical depth must be a positive number"
    }

    if (shape === "Rectangular") {
      if (!length.trim()) newErrors.length = "Length is required"
      else if (isNaN(Number.parseFloat(length)) || Number.parseFloat(length) <= 0) {
        newErrors.length = "Length must be a positive number"
      }

      if (!width.trim()) newErrors.width = "Width is required"
      else if (isNaN(Number.parseFloat(width)) || Number.parseFloat(width) <= 0) {
        newErrors.width = "Width must be a positive number"
      }

      if (!height.trim()) newErrors.height = "Height is required"
      else if (isNaN(Number.parseFloat(height)) || Number.parseFloat(height) <= 0) {
        newErrors.height = "Height must be a positive number"
      }
    } else if (shape === "Cylindrical") {
      if (!diameter.trim()) newErrors.diameter = "Diameter is required"
      else if (isNaN(Number.parseFloat(diameter)) || Number.parseFloat(diameter) <= 0) {
        newErrors.diameter = "Diameter must be a positive number"
      }

      if (!height.trim()) newErrors.height = "Height is required"
      else if (isNaN(Number.parseFloat(height)) || Number.parseFloat(height) <= 0) {
        newErrors.height = "Height must be a positive number"
      }
    }

    if (locationType === "manual") {
      if (!latitude.trim()) newErrors.latitude = "Latitude is required"
      else if (
        isNaN(Number.parseFloat(latitude)) ||
        Number.parseFloat(latitude) < -90 ||
        Number.parseFloat(latitude) > 90
      ) {
        newErrors.latitude = "Latitude must be between -90 and 90"
      }

      if (!longitude.trim()) newErrors.longitude = "Longitude is required"
      else if (
        isNaN(Number.parseFloat(longitude)) ||
        Number.parseFloat(longitude) < -180 ||
        Number.parseFloat(longitude) > 180
      ) {
        newErrors.longitude = "Longitude must be between -180 and 180"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    try {
      const userId = auth.currentUser.uid

      // Create reservoir data object
      const reservoirData = {
        userId,
        name,
        type,
        shape,
        criticalDepth: Number.parseFloat(criticalDepth),
        location: {
          latitude: Number.parseFloat(latitude),
          longitude: Number.parseFloat(longitude),
        },
        createdAt: new Date(),
      }

      // Add shape-specific dimensions
      if (shape === "Rectangular") {
        reservoirData.dimensions = {
          length: Number.parseFloat(length),
          width: Number.parseFloat(width),
          height: Number.parseFloat(height),
        }
      } else if (shape === "Cylindrical") {
        reservoirData.dimensions = {
          diameter: Number.parseFloat(diameter),
          height: Number.parseFloat(height),
        }
      }

      // Save to Firestore
      const docRef = await addDoc(collection(db, "reservoirs"), reservoirData)

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        "reservoirData",
        JSON.stringify({
          ...reservoirData,
          id: docRef.id,
        }),
      )

      setSnackbarMessage("Reservoir saved successfully")
      setSnackbarVisible(true)

      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack()
      }, 1500)
    } catch (error) {
      console.log("Error saving reservoir:", error)
      setSnackbarMessage("Failed to save reservoir. Please try again.")
      setSnackbarVisible(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Add Your Reservoir</Text>

        <TextInput
          label="Reservoir Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          error={!!errors.name}
        />
        {!!errors.name && <HelperText type="error">{errors.name}</HelperText>}

        <Text style={styles.label}>Type of Usage</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={type} onValueChange={(itemValue) => setType(itemValue)} style={styles.picker}>
            {usageTypes.map((item) => (
              <Picker.Item key={item} label={item} value={item} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Shape</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={shape} onValueChange={(itemValue) => setShape(itemValue)} style={styles.picker}>
            {shapeTypes.map((item) => (
              <Picker.Item key={item} label={item} value={item} />
            ))}
          </Picker>
        </View>

        <Text style={styles.sectionTitle}>Dimensions</Text>
        <Divider style={styles.divider} />

        {shape === "Rectangular" ? (
          <>
            <TextInput
              label="Length (meters)"
              value={length}
              onChangeText={setLength}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.length}
            />
            {!!errors.length && <HelperText type="error">{errors.length}</HelperText>}

            <TextInput
              label="Width (meters)"
              value={width}
              onChangeText={setWidth}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.width}
            />
            {!!errors.width && <HelperText type="error">{errors.width}</HelperText>}

            <TextInput
              label="Height (meters)"
              value={height}
              onChangeText={setHeight}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.height}
            />
            {!!errors.height && <HelperText type="error">{errors.height}</HelperText>}
          </>
        ) : shape === "Cylindrical" ? (
          <>
            <TextInput
              label="Diameter (meters)"
              value={diameter}
              onChangeText={setDiameter}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.diameter}
            />
            {!!errors.diameter && <HelperText type="error">{errors.diameter}</HelperText>}

            <TextInput
              label="Height (meters)"
              value={height}
              onChangeText={setHeight}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.height}
            />
            {!!errors.height && <HelperText type="error">{errors.height}</HelperText>}
          </>
        ) : (
          <Text style={styles.note}>Please specify dimensions for your custom shape.</Text>
        )}

        <TextInput
          label="Critical Minimum Depth (meters)"
          value={criticalDepth}
          onChangeText={setCriticalDepth}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          error={!!errors.criticalDepth}
        />
        {!!errors.criticalDepth && <HelperText type="error">{errors.criticalDepth}</HelperText>}

        <Text style={styles.sectionTitle}>Location</Text>
        <Divider style={styles.divider} />

        <RadioButton.Group onValueChange={(value) => setLocationType(value)} value={locationType}>
          <View style={styles.radioOption}>
            <RadioButton.Item
              label="Use device GPS location"
              value="gps"
              position="leading"
              disabled={locationLoading}
            />
          </View>
          <View style={styles.radioOption}>
            <RadioButton.Item label="Enter coordinates manually" value="manual" position="leading" />
          </View>
        </RadioButton.Group>

        {locationLoading && <Text style={styles.loadingText}>Getting your location...</Text>}

        {locationType === "manual" && (
          <>
            <TextInput
              label="Latitude"
              value={latitude}
              onChangeText={setLatitude}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.latitude}
            />
            {!!errors.latitude && <HelperText type="error">{errors.latitude}</HelperText>}

            <TextInput
              label="Longitude"
              value={longitude}
              onChangeText={setLongitude}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.longitude}
            />
            {!!errors.longitude && <HelperText type="error">{errors.longitude}</HelperText>}
          </>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          loading={loading}
          disabled={loading || locationLoading}
        >
          Save Reservoir
        </Button>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: "OK",
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2196F3",
    textAlign: "center",
  },
  input: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
    color: "#546E7A",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#BBDEFB",
    borderRadius: 5,
    marginBottom: 15,
  },
  picker: {
    height: 50,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 5,
    color: "#1976D2",
  },
  divider: {
    marginBottom: 15,
  },
  radioOption: {
    marginBottom: 5,
  },
  loadingText: {
    color: "#2196F3",
    fontStyle: "italic",
    marginVertical: 10,
    textAlign: "center",
  },
  note: {
    color: "#546E7A",
    fontStyle: "italic",
    marginVertical: 10,
  },
  button: {
    marginTop: 30,
    paddingVertical: 8,
  },
})

export default ReservoirForm
