import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { auth } from "../firebase-config"
import { signInWithEmailAndPassword } from "firebase/auth"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

const Login = () => {
  const navigation = useNavigation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [secureTextEntry, setSecureTextEntry] = useState(true)

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs")
      return
    }

    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // Navigation is handled by the auth state listener in App.js
    } catch (error) {
      let errorMessage = "Une erreur est survenue lors de la connexion"
      if (error.code === "auth/user-not-found") {
        errorMessage = "Aucun utilisateur trouvé avec cet email"
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Mot de passe incorrect"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Format d'email invalide"
      }
      Alert.alert("Erreur de connexion", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image source={require("../assets/intro1.png")} style={styles.logo} />
          <Text style={styles.appName}>Water Management</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Connexion</Text>

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

          <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Connexion en cours..." : "Se connecter"}</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Vous n'avez pas de compte ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.registerLink}>S'inscrire</Text>
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3498DB",
    marginTop: 10,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#3498DB",
    fontSize: 14,
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
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  registerText: {
    color: "#7F8C8D",
    fontSize: 14,
  },
  registerLink: {
    color: "#3498DB",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
})

export default Login
