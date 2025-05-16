
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from "react-native"
import { auth } from "../firebase-config"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

const Alerts = () => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [comment, setComment] = useState("")

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const user = auth.currentUser
      if (!user) return

      // In a real app, you would fetch alerts from your database
      // For this example, we'll generate mock data
      const mockAlerts = generateMockAlerts()
      setAlerts(mockAlerts)
    } catch (error) {
      console.error("Error fetching alerts:", error)
      Alert.alert("Erreur", "Impossible de charger les alertes")
    } finally {
      setLoading(false)
    }
  }

  const generateMockAlerts = () => {
    const mockAlerts = []
    const types = ["ph", "temperature", "turbidity", "waterLevel"]
    const statuses = ["resolved", "unresolved"]

    // Generate 10 random alerts
    for (let i = 0; i < 10; i++) {
      const type = types[Math.floor(Math.random() * types.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const date = new Date()
      date.setDate(date.getDate() - Math.floor(Math.random() * 30))

      let message = ""
      switch (type) {
        case "ph":
          message = "pH anormalement bas"
          break
        case "temperature":
          message = "Température élevée"
          break
        case "turbidity":
          message = "Turbidité élevée"
          break
        case "waterLevel":
          message = "Niveau d'eau bas"
          break
      }

      mockAlerts.push({
        id: `alert-${i}`,
        type,
        message,
        timestamp: date,
        status,
        comment: status === "resolved" ? "Problème résolu" : "",
      })
    }

    // Sort by date (newest first)
    return mockAlerts.sort((a, b) => b.timestamp - a.timestamp)
  }

  const handleResolveAlert = (alert) => {
    setSelectedAlert(alert)
    setComment(alert.comment || "")
    setModalVisible(true)
  }

  const saveComment = () => {
    if (!selectedAlert) return

    // Update the alert in the state
    const updatedAlerts = alerts.map((alert) => {
      if (alert.id === selectedAlert.id) {
        return {
          ...alert,
          status: "resolved",
          comment,
        }
      }
      return alert
    })

    setAlerts(updatedAlerts)
    setModalVisible(false)

    // In a real app, you would update the alert in your database
    Alert.alert("Succès", "Alerte marquée comme résolue")
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case "ph":
        return "flask-outline"
      case "temperature":
        return "thermometer"
      case "turbidity":
        return "water"
      case "waterLevel":
        return "water-percent"
      default:
        return "alert-circle-outline"
    }
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderAlertItem = ({ item }) => (
    <View style={[styles.alertItem, item.status === "resolved" ? styles.alertItemResolved : null]}>
      <View style={styles.alertHeader}>
        <View style={styles.alertTypeContainer}>
          <Icon name={getAlertIcon(item.type)} size={24} color="#3498DB" />
          <Text style={styles.alertType}>
            {item.type === "ph"
              ? "pH"
              : item.type === "temperature"
                ? "Température"
                : item.type === "turbidity"
                  ? "Turbidité"
                  : "Niveau d'eau"}
          </Text>
        </View>
        <View style={[styles.alertStatus, { backgroundColor: item.status === "resolved" ? "#2ECC71" : "#F39C12" }]}>
          <Text style={styles.alertStatusText}>{item.status === "resolved" ? "Résolu" : "Non résolu"}</Text>
        </View>
      </View>

      <Text style={styles.alertMessage}>{item.message}</Text>
      <Text style={styles.alertTimestamp}>{formatDate(item.timestamp)}</Text>

      {item.comment ? (
        <View style={styles.commentContainer}>
          <Text style={styles.commentLabel}>Commentaire:</Text>
          <Text style={styles.commentText}>{item.comment}</Text>
        </View>
      ) : null}

      {item.status === "unresolved" ? (
        <TouchableOpacity style={styles.resolveButton} onPress={() => handleResolveAlert(item)}>
          <Text style={styles.resolveButtonText}>Marquer comme résolu</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alertes</Text>
        <Text style={styles.subtitle}>Suivi des anomalies détectées sur votre réservoir</Text>
      </View>

      <FlatList
        data={alerts}
        renderItem={renderAlertItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{loading ? "Chargement des alertes..." : "Aucune alerte à afficher"}</Text>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Résoudre l'alerte</Text>

            <Text style={styles.modalLabel}>Commentaire (optionnel):</Text>
            <TextInput
              style={styles.modalInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Ajouter un commentaire..."
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, styles.modalSaveButton]} onPress={saveComment}>
                <Text style={styles.modalSaveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#7F8C8D",
  },
  listContainer: {
    padding: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#7F8C8D",
    marginTop: 50,
  },
  alertItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#F39C12",
  },
  alertItemResolved: {
    borderLeftColor: "#2ECC71",
    opacity: 0.8,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  alertTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginLeft: 5,
  },
  alertStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  alertStatusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  alertMessage: {
    fontSize: 16,
    color: "#2C3E50",
    marginBottom: 5,
  },
  alertTimestamp: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 10,
  },
  commentContainer: {
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 5,
  },
  commentText: {
    fontSize: 14,
    color: "#2C3E50",
  },
  resolveButton: {
    backgroundColor: "#3498DB",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
  },
  resolveButtonText: {
    color: "#fff",
    fontWeight: "bold",
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
  modalLabel: {
    fontSize: 16,
    color: "#2C3E50",
    marginBottom: 5,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 5,
    padding: 10,
    minHeight: 100,
    textAlignVertical: "top",
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

export default Alerts
