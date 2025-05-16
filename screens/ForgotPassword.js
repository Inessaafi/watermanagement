
import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { auth } from "../firebase-config"
import { sendPasswordResetEmail } from "firebase/auth"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

const ForgotPassword = () => {
  const navigation = useNavigation()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Erreur", "Veuillez entrer votre adresse email")
      return
    }

    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      Alert.alert("Email envoyé", "Un email de réinitialisation a été envoyé à votre adresse email", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ])
    } catch (error) {
      let errorMessage = "Une erreur est survenue"
      if (error.code === "auth/user-not-found") {
        errorMessage = "Aucun utilisateur trouvé avec cet email"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Format d'email invalide"
      }
      Alert.alert("Erreur", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Mot de passe oublié</Text>
          <Text style={styles.subtitle}>Entrez votre adresse email pour recevoir un lien de réinitialisation</Text>

          <View style={styles.inputContainer}>
            <Icon name="email-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Envoi en cours..." : "Réinitialiser le mot de passe"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Login")}>
            <Icon name="arrow-left" size={20} color="#3498DB" />
            <Text style={styles.backButtonText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#7F8C8D",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: "#F8F9FA",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: "#2C3E50",
  },
  button: {
    backgroundColor: "#3498DB",
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: "#A5CFF1",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#3498DB",
    fontSize: 16,
    marginLeft: 5,
  },
})

export default ForgotPassword
