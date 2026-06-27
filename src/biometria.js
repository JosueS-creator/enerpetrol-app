// Utilidades para inicio de sesión con huella digital / Face ID,
// usando el estándar WebAuthn (soportado por Chrome, Safari y la mayoría
// de navegadores modernos en celulares con sensor biométrico).
//
// Cómo funciona en la práctica:
// 1. El cliente inicia sesión normal una vez (correo + contraseña).
// 2. Le ofrecemos activar "desbloqueo con huella". Si acepta, el teléfono
//    crea una llave criptográfica ligada a su huella/Face ID y la guardamos
//    asociada a su cuenta.
// 3. La próxima vez, en lugar de escribir su contraseña, toca "Entrar con
//    huella" y el teléfono pide la huella; si coincide, lo dejamos entrar.

export function soportaBiometria() {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential
}

export async function dispositivoTieneBiometria() {
  if (!soportaBiometria()) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

function bufferAleatorio(longitud = 32) {
  const buffer = new Uint8Array(longitud)
  crypto.getRandomValues(buffer)
  return buffer
}

// Registra la huella/Face ID del usuario en este dispositivo.
// Devuelve el "credential ID" que debes guardar (por ejemplo, en localStorage
// o en la tabla de perfiles) para usarlo después al verificar.
export async function registrarBiometria(emailUsuario, nombreUsuario) {
  const challenge = bufferAleatorio()
  const userId = bufferAleatorio(16)

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Enerpetrol' },
      user: {
        id: userId,
        name: emailUsuario,
        displayName: nombreUsuario,
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // usa el sensor del propio teléfono, no llaves externas
        userVerification: 'required',
      },
      timeout: 60000,
    },
  })

  // Convertimos el ID a texto para poder guardarlo fácilmente
  const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
  return credentialId
}

// Verifica la huella/Face ID contra una credencial ya registrada.
export async function verificarBiometria(credentialId) {
  const challenge = bufferAleatorio()
  const rawId = Uint8Array.from(atob(credentialId), (c) => c.charCodeAt(0))

  const resultado = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ id: rawId, type: 'public-key' }],
      userVerification: 'required',
      timeout: 60000,
    },
  })

  return !!resultado
}
