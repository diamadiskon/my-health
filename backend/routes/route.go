package routes

import (
	"github.com/gin-gonic/gin"

	"my-health/controllers"
	"my-health/middlewares"
)

func SetupRoutes(r *gin.Engine) {
	// Public routes
	r.POST("/login", controllers.Login)
	r.POST("/create-user", controllers.CreateUser)
	r.GET("/logout", controllers.Logout)

	// Protected routes
	protected := r.Group("/")
	protected.Use(middlewares.CheckAuth)
	{
		// User routes
		protected.GET("/user", controllers.GetUserDetails)

		// Admin routes
		protected.GET("/admin/profile", controllers.GetAdminProfile)
		protected.POST("/admin/profile", controllers.UpdateAdminProfile)

		// Patient routes
		protected.GET("/patient/:id", controllers.GetPatientDetails)
		protected.POST("/patient/edit/:id", controllers.UpdatePatient)
		protected.GET("/patient/check-details/:userId", controllers.CheckPatientDetails)

		// Health metrics routes
		protected.GET("/api/health-metrics/:patientId", controllers.GetPatientHealthMetrics)

		// Household routes
		protected.GET("/household/patients", controllers.GetHouseholdPatients)
		protected.POST("/create-invitation", controllers.CreateInvitation)
		protected.POST("/respond-invitation", controllers.RespondToInvitation)
		protected.GET("/invitations", controllers.GetInvitations)

		// AI Chat routes
		chatController := controllers.NewChatController()
		protected.POST("/api/ai/chat", chatController.SendMessage)
		protected.GET("/api/ai/history", chatController.GetHistory)
		protected.DELETE("/api/ai/clear", chatController.ClearHistory)
		protected.GET("/api/ai/status", chatController.GetStatus)
	}
}
