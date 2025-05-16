
import { useState, useEffect } from "react"
import {View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native"
import { auth, firestore } from "../firebase-config"
import { updateProfile, signOut } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

const Profile = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reservoirData, setReservoirData] = useState(null)
  const [offlineMode, setOfflineMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editField, setEditField] = useState("")
  const [editValue, setEditValue] = useState("")
  const [editTitle, setEditTitle] = useState("")

  useEffect(() => {
    fetchUserData()
    loadSettings()
  }, [])

  const fetchUserData = async () => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) return

      setUser(currentUser)

      // Get user data from Firestore
      const userDoc = await getDoc(doc(firestore, "users", currentUser.uid))
      const userData = userDoc.data()

      if (userData?.reservoirId) {
        const reservoirDoc = await getDoc(doc(firestore, "reservoirs", userData.reservoirId))
        const reservoir = { id: reservoirDoc.id, ...reservoirDoc.data() }
        setReservoirData(reservoir)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      Alert.alert("Erreur", "Impossible de charger les données utilisateur")
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem("userSettings")
      if (settings) {
        const parsedSettings = JSON.parse(settings)
        setOfflineMode(parsedSettings.offlineMode || false)
        setNotifications(parsedSettings.notifications !== false) // Default to true
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const saveSettings = async () => {
    try {
      const settings = {
        offlineMode,
        notifications,
      }
      await AsyncStorage.setItem("userSettings", JSON.stringify(settings))
    } catch (error) {
      console.error("Error saving settings:", error)
      Alert.alert("Erreur", "Impossible de sauvegarder les paramètres")
    }
  }

  const toggleOfflineMode = (value) => {
    setOfflineMode(value)
    setTimeout(() => saveSettings(), 100)
  }

  const toggleNotifications = (value) => {
    setNotifications(value)
    setTimeout(() => saveSettings(), 100)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
      Alert.alert("Erreur", "Impossible de se déconnecter")
    }
  }

  const openEditModal = (field, value, title) => {
    setEditField(field)
    setEditValue(value)
    setEditTitle(title)
    setEditModalVisible(true)
  }

  const saveEdit = async () => {
    try {
      setLoading(true)
      const currentUser = auth.currentUser

      if (editField === "name") {
        await updateProfile(currentUser, {
          displayName: editValue,
        })

        await updateDoc(doc(firestore, "users", currentUser.uid), {
          name: editValue,
        })

        // Refresh user data
        setUser({ ...currentUser, displayName: editValue })
      } else if (editField === "capacity") {
        if (reservoirData) {
          const capacity = Number.parseFloat(editValue)
          if (isNaN(capacity)) {
            throw new Error("La capacité doit être un nombre")
          }

          await updateDoc(doc(firestore, "reservoirs", reservoirData.id), {
            capacity,
          })

          // Update local state
          setReservoirData({ ...reservoirData, capacity })

          // Update local storage for offline mode
          const localData = await AsyncStorage.getItem(`reservoirData_${currentUser.uid}`)
          if (localData) {
            const parsedData = JSON.parse(localData)
            parsedData.capacity = capacity
            await AsyncStorage.setItem(`reservoirData_${currentUser.uid}`, JSON.stringify(parsedData))
          }
        }
      }

      setEditModalVisible(false)
    } catch (error) {
      console.error("Error updating data:", error)
      Alert.alert("Erreur", error.message || "Impossible de mettre à jour les données")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil & Paramètres</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>

        <View style={styles.infoItem}>
          <View style={styles.infoLabel}>
            <Icon name="account" size={20} color="#3498DB" />
            <Text style={styles.infoLabelText}>Nom</Text>
          </View>
          <View style={styles.infoValue}>
            <Text style={styles.infoValueText}>{user?.displayName || "Non défini"}</Text>
            <TouchableOpacity onPress={() => openEditModal("name", user?.displayName || "", "Modifier le nom")}>
              <Icon name="pencil" size={20} color="#7F8C8D" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoLabel}>
            <Icon name="email" size={20} color="#3498DB" />
            <Text style={styles.infoLabelText}>Email</Text>
          </View>
          <View style={styles.infoValue}>
            <Text style={styles.infoValueText}>{user?.email || "Non défini"}</Text>
          </View>
        </View>
      </View>

      {reservoirData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du réservoir</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Icon name="water-outline" size={20} color="#3498DB" />
              <Text style={styles.infoLabelText}>Capacité</Text>
            </View>
            <View style={styles.infoValue}>
              <Text style={styles.infoValueText}>{reservoirData.capacity} L</Text>
              <TouchableOpacity
                onPress={() => openEditModal("capacity", reservoirData.capacity.toString(), "Modifier la capacité")}
              >
                <Icon name="pencil" size={20} color="#7F8C8D" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Icon name="home-outline" size={20} color="#3498DB" />
              <Text style={styles.infoLabelText}>Type d'usage</Text>
            </View>
            <View style={styles.infoValue}>
              <Text style={styles.infoValueText}>
                {reservoirData.usageType === "domestic"
                  ? "Domestique"
                  : reservoirData.usageType === "agricultural"
                    ? "Agricole"
                    : reservoirData.usageType === "industrial"
                      ? "Industriel"
                      : reservoirData.usageType === "commercial"
                        ? "Commercial"
                        : "Autre"}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Icon name="map-marker-outline" size={20} color="#3498DB" />
              <Text style={styles.infoLabelText}>Localisation</Text>
            </View>
            <View style={styles.infoValue}>
              <Text style={styles.infoValueText}>
                {reservoirData.location.manual
                  ? reservoirData.location.manual
                  : `${Number.parseFloat(reservoirData.location.latitude).toFixed(4)}, ${Number.parseFloat(reservoirData.location.longitude).toFixed(4)}`}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Icon name="chip" size={20} color="#3498DB" />
              <Text style={styles.infoLabelText}>Capteurs</Text>
            </View>
            <View style={styles.infoValue}>
              <Text style={styles.infoValueText}>
                {Object.entries(reservoirData.sensors)
                  .filter(([_, value]) => value)
                  .map(([key, _]) =>
                    key === "ph"
                      ? "pH"
                      : key === "temperature"
                        ? "Température"
                        : key === "turbidity"
                          ? "Turbidité"
                          : "Niveau d'eau",
                  )
                  .join(", ")}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLabel}>
            <Icon name="wifi-off" size={20} color="#3498DB" />
            <Text style={styles.settingLabelText}>Mode hors ligne</Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={toggleOfflineMode}
            trackColor={{ false: "#E0E0E0", true: "#A5CFF1" }}
            thumbColor={offlineMode ? "#3498DB" : "#f4f3f4"}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLabel}>
            <Icon name="bell-outline" size={20} color="#3498DB" />
            <Text style={styles.settingLabelText}>Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{ false: "#E0E0E0", true: "#A5CFF1" }}
            thumbColor={notifications ? "#3498DB" : "#f4f3f4"}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Déconnexion</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editTitle}</Text>

            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType={editField === "capacity" ? "numeric" : "default"}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, styles.modalSaveButton]} onPress={saveEdit}>
                <Text style={styles.modalSaveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabelText: {
    fontSize: 16,
    color: "#2C3E50",
    marginLeft: 10,
  },
  infoValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoValueText: {
    fontSize: 16,
    color: "#7F8C8D",
    marginRight: 10,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  settingLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingLabelText: {
    fontSize: 16,
    color: "#2C3E50",
    marginLeft: 10,
  },
  logoutButton: {
    backgroundColor: "#E74C3C",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#E0E0E0",
    marginRight: 5,
  },
  modalCancelButtonText: {
    color: "#2C3E50",
    fontWeight: "bold",
  },
  modalSaveButton: {
    backgroundColor: "#3498DB",
    marginLeft: 5,
  },
  modalSaveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
})

export default Profile
