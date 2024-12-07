// PATH: perseas-auth-service/routes/auth.go

package routes

import (
	"github.com/gin-gonic/gin"

	"my-health/controllers"
)

func AuthRoutes(r *gin.Engine) {
	hc := &controllers.HouseholdController{}
	r.POST("/login", controllers.Login)
	r.POST("/create-user", controllers.CreateUser)
	r.GET("/user", controllers.GetUserDetails)
	r.GET("/household/patients", controllers.GetHouseholdPatients)
	r.GET("/api/health-metrics", gin.WrapF(controllers.MetricsHandler))
	r.POST("/create-invitation", hc.CreateInvitation)
	r.POST("/respond-invitation", controllers.RespondToInvitation)
	r.GET("/invitations", controllers.GetInvitations)
	r.GET("/logout", controllers.Logout)
	r.GET("/patient/:id", controllers.GetPatientDetails)
	r.POST("/patient/edit/:id", controllers.UpdatePatient)
}
