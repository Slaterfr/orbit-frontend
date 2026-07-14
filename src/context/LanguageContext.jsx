import { createContext, useState, useEffect, useContext } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const translations = {
  en: {
    navbar: {
      home: "Home",
      lookup: "User Lookup",
      logout: "Log Out",
      friendRequests: "Friend Requests",
      noRequests: "No pending friend requests",
      accept: "Accept",
      decline: "Decline",
      searchPlaceholder: "Search users...",
      sentRequest: "sent you a friend request"
    },
    auth: {
      loginTitle: "Log In to Orbit",
      registerTitle: "Create Your Orbit Account",
      email: "Email Address",
      username: "Username",
      password: "Password",
      bio: "Bio (Optional)",
      loginBtn: "Log In",
      registerBtn: "Sign Up",
      haveAccount: "Already have an account? Log In",
      needAccount: "New to Orbit? Sign Up",
      invalidCreds: "Invalid credentials",
      regFailed: "Registration failed",
      passwordHint: "Password must be 8+ characters, contain one uppercase letter and one digit",
      forgotPassword: "Forgot Password?",
      forgotPasswordTitle: "Recover Orbit Password",
      forgotPasswordDesc: "Enter your email address and we will send you a secure link to reset your password.",
      forgotPasswordBtn: "Send Recovery Link",
      forgotPasswordSuccess: "If the email exists, a recovery link has been sent. Check your inbox!",
      resetPasswordTitle: "Reset Password",
      newPassword: "New Password",
      confirmPassword: "Confirm New Password",
      resetPasswordBtn: "Save New Password",
      resetPasswordSuccess: "Your password has been changed successfully! Redirecting to login...",
      passwordsMismatch: "Passwords do not match."
    },
    feed: {
      createPost: "Create a Post",
      postTitle: "Post Title",
      postPlaceholder: "What's on your mind?",
      uploadImage: "Upload Image",
      publishing: "Publishing...",
      postBtn: "Post",
      postsTitle: "Recent Posts",
      noPosts: "No posts yet. Be the first to share something!",
      commentsCount: "Comments",
      likesCount: "Likes"
    },
    profile: {
      changePic: "Change Profile Picture",
      friends: "Friends",
      posts: "Posts",
      joined: "Joined",
      editBio: "Edit Bio",
      noBio: "No bio available.",
      save: "Save",
      cancel: "Cancel",
      bioPlaceholder: "Tell us about yourself...",
      notFound: "User Not Found",
      notFoundMsg: "The profile you are looking for does not exist or has been deleted.",
      backHome: "Go Back Home",
      status: {
        friends: "Friends",
        pendingSent: "Friend Request Sent",
        pendingRecv: "Accept Friend Request",
        none: "Add Friend",
        self: "Your Profile"
      },
      unfriend: "Unfriend",
      cancelRequest: "Cancel Request",
      acceptRequest: "Accept Request",
      rejectRequest: "Decline Request"
    },
    postDetail: {
      back: "Back to Feed",
      edited: "edited",
      deleteConfirm: "Are you sure you want to delete this post?",
      deleteCommentConfirm: "Are you sure you want to delete this comment?",
      commentsSection: "Comments",
      noComments: "No comments yet. Start the conversation!",
      addComment: "Add a comment...",
      commentBtn: "Post",
      reply: "Reply",
      edit: "Edit",
      delete: "Delete",
      cancel: "Cancel",
      save: "Save",
      replyingTo: "Replying to"
    },
    avatar: {
      title: "Upload Profile Picture",
      select: "Select an image from your device",
      dragDrop: "or drag and drop it here",
      supported: "PNG, JPG or WEBP up to 5MB",
      uploading: "Uploading...",
      uploadBtn: "Upload Picture",
      success: "Profile picture updated successfully!",
      back: "Back to Profile"
    },
    landing: {
      heroTitle: "Your Universe, Connected",
      heroSubtitle: "Welcome to Orbit — a clean, fast, and modern space to connect, share photos, and discover stories.",
      exploreBtn: "Explore Orbit",
      meetCreatorBtn: "Meet the Creator",
      featuresTitle: "Why Orbit?",
      featFastApiTitle: "FastAPI Engine",
      featFastApiDesc: "High-performance Python backend managing stateless JWT sessions and database-backed security.",
      featReactTitle: "React SPA UI",
      featReactDesc: "Vibrant, single-page client interface offering smooth transitions and instantaneous notifications.",
      featPillowTitle: "Media Optimization",
      featPillowDesc: "Automated EXIF orientation transposition and WebP compression for lightning-fast feeds.",
      creatorTitle: "Behind the Orbit",
      creatorBio: "Hey! I'm Slater, Software Dev and Computer Engineering student, and creator of Orbit, of course. I designed this application as a personal vlog for friends and acquaintances, as a space where they can interact and share whatever they want! In case of bugs, questions, or suggestions please contact me on my insta or email. Enjoy Orbit!",
      creatorSocials: "Connect with Me"
    }
  },
  es: {
    navbar: {
      home: "Inicio",
      lookup: "Buscar Usuario",
      logout: "Cerrar Sesión",
      friendRequests: "Solicitudes de Amistad",
      noRequests: "No hay solicitudes pendientes",
      accept: "Aceptar",
      decline: "Declinar",
      searchPlaceholder: "Buscar usuarios...",
      sentRequest: "te envió una solicitud de amistad"
    },
    auth: {
      loginTitle: "Iniciar Sesión en Orbit",
      registerTitle: "Crea tu Cuenta de Orbit",
      email: "Correo Electrónico",
      username: "Nombre de Usuario",
      password: "Contraseña",
      bio: "Biografía (Opcional)",
      loginBtn: "Iniciar Sesión",
      registerBtn: "Registrarse",
      haveAccount: "¿Ya tienes una cuenta? Inicia Sesión",
      needAccount: "¿Nuevo en Orbit? Regístrate",
      invalidCreds: "Credenciales inválidas",
      regFailed: "El registro falló",
      passwordHint: "La contraseña debe tener más de 8 caracteres, una letra mayúscula y un dígito",
      forgotPassword: "¿Olvidaste tu contraseña?",
      forgotPasswordTitle: "Recuperar Contraseña de Orbit",
      forgotPasswordDesc: "Ingresa tu correo electrónico y te enviaremos un enlace seguro para restablecer tu contraseña.",
      forgotPasswordBtn: "Enviar Enlace de Recuperación",
      forgotPasswordSuccess: "Si el correo existe, se ha enviado un enlace de recuperación. ¡Revisa tu correo!",
      resetPasswordTitle: "Restablecer Contraseña",
      newPassword: "Nueva Contraseña",
      confirmPassword: "Confirmar Nueva Contraseña",
      resetPasswordBtn: "Guardar Nueva Contraseña",
      resetPasswordSuccess: "¡Tu contraseña ha sido cambiada con éxito! Redirigiendo...",
      passwordsMismatch: "Las contraseñas no coinciden."
    },
    feed: {
      createPost: "Crear una Publicación",
      postTitle: "Título",
      postPlaceholder: "¿Qué tienes en mente?",
      uploadImage: "Subir Imagen",
      publishing: "Publicando...",
      postBtn: "Publicar",
      postsTitle: "Publicaciones Recientes",
      noPosts: "No hay publicaciones aún. ¡Sé el primero en compartir algo!",
      commentsCount: "Comentarios",
      likesCount: "Me gusta"
    },
    profile: {
      changePic: "Cambiar Foto de Perfil",
      friends: "Amigos",
      posts: "Publicaciones",
      joined: "Miembro desde",
      editBio: "Editar Biografía",
      noBio: "Biografía no disponible.",
      save: "Guardar",
      cancel: "Cancelar",
      bioPlaceholder: "Cuéntanos sobre ti...",
      notFound: "Usuario no encontrado",
      notFoundMsg: "El perfil que buscas no existe o ha sido eliminado.",
      backHome: "Volver al Inicio",
      status: {
        friends: "Amigos",
        pendingSent: "Solicitud de Amistad Enviada",
        pendingRecv: "Aceptar Solicitud",
        none: "Agregar Amigo",
        self: "Tu Perfil"
      },
      unfriend: "Eliminar Amigo",
      cancelRequest: "Cancelar Solicitud",
      acceptRequest: "Aceptar Solicitud",
      rejectRequest: "Declinar Solicitud"
    },
    postDetail: {
      back: "Volver al Inicio",
      edited: "editado",
      deleteConfirm: "¿Estás seguro de que quieres eliminar esta publicación?",
      deleteCommentConfirm: "¿Estás seguro de que quieres eliminar este comentario?",
      commentsSection: "Comentarios",
      noComments: "No hay comentarios aún. ¡Inicia la conversación!",
      addComment: "Escribe un comentario...",
      commentBtn: "Comentar",
      reply: "Responder",
      edit: "Editar",
      delete: "Eliminar",
      cancel: "Cancelar",
      save: "Guardar",
      replyingTo: "Respondiendo a"
    },
    avatar: {
      title: "Subir Foto de Perfil",
      select: "Selecciona una imagen desde tu dispositivo",
      dragDrop: "o arrástrala y suéltala aquí",
      supported: "PNG, JPG o WEBP hasta 5MB",
      uploading: "Subiendo...",
      uploadBtn: "Subir Imagen",
      success: "¡Foto de perfil actualizada con éxito!",
      back: "Volver al Perfil"
    },
    landing: {
      heroTitle: "Tu Universo, Conectado",
      heroSubtitle: "Bienvenido a Orbit: un espacio limpio, rápido y moderno para conectarte, compartir fotos y descubrir historias.",
      exploreBtn: "Explorar Orbit",
      meetCreatorBtn: "Conocer al Creador",
      featuresTitle: "¿Por qué Orbit?",
      featFastApiTitle: "Motor FastAPI",
      featFastApiDesc: "Backend en Python de alto rendimiento que gestiona sesiones JWT sin estado y seguridad integrada.",
      featReactTitle: "Interfaz React SPA",
      featReactDesc: "Cliente web fluido que ofrece transiciones rápidas y notificaciones instantáneas.",
      featPillowTitle: "Optimización de Medios",
      featPillowDesc: "Transposición automática de orientación EXIF y compresión WebP para cargas ultrarrápidas.",
      creatorTitle: "Detrás de Orbit",
      creatorBio: "¡Hey! soy Slater, Software Dev y estudiante de Ingeniería Informática, y creador de Orbit, por supuesto. Diseñé esta aplicación a manera de vlog personal para amigos y conocidos, como un espacio donde puedan interactuar y compartir lo que quieran! En caso de bugs, preguntas, o sugerencias por favor contáctame a mi insta o mail. ¡Disfruta de Orbit!",
      creatorSocials: "Conéctate Conmigo"
    }
  }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === 'en' ? 'es' : 'en'));
    };

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                return key;
            }
        }
        return value;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
