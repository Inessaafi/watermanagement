
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
import { auth, firestore } from "../firebase-config"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

const SignUp = () => {
  const navigation = useNavigation()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [secureTextEntry, setSecureTextEntry] = useState(true)
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true)

  const handleRegister = async () => {
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas")
      return
    }

    if (password.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    setLoading(true)
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update user profile
      await updateProfile(userCredential.user, {
        displayName: name,
      })

      // Store additional user data in Firestore
      await setDoc(doc(firestore, "users", userCredential.user.uid), {
        name,
        email,
        createdAt: serverTimestamp(),
      })

      // Navigation is handled by the auth state listener in App.js
    } catch (error) {
      let errorMessage = "Une erreur est survenue lors de l'inscription"
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Cet email est déjà utilisé"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Format d'email invalide"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Le mot de passe est trop faible"
      }
      Alert.alert("Erreur d'inscription", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Créer un compte</Text>

          <View style={styles.inputContainer}>
            <Icon name="account-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Nom complet" value={name} onChangeText={setName} />
          </View>

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

          <View style={styles.inputContainer}>
            <Icon name="lock-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
            />
            <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)} style={styles.eyeIcon}>
              <Icon name={secureTextEntry ? "eye-outline" : "eye-off-outline"} size={20} color="#7F8C8D" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={secureConfirmTextEntry}
            />
            <TouchableOpacity onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)} style={styles.eyeIcon}>
              <Icon name={secureConfirmTextEntry ? "eye-outline" : "eye-off-outline"} size={20} color="#7F8C8D" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Inscription en cours..." : "S'inscrire"}</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Vous avez déjà un compte ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    marginBottom: 15,
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
  eyeIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: "#3498DB",
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
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
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    color: "#7F8C8D",
    fontSize: 14,
  },
  loginLink: {
    color: "#3498DB",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
})

export default SignUp
