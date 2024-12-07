package controllers

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"time"

	"my-health/models"
)

// GenerateMockData generates mock health metrics data.
func GenerateMockData() []models.HealthMetrics {
	var metrics []models.HealthMetrics
	for i := 0; i < 1; i++ { // Generate 1 records
		metrics = append(metrics, models.HealthMetrics{
			Date:             time.Now().AddDate(0, 0, -i),              // Last 1 day
			HeartRate:        rand.Intn(41) + 60,                        // Random heart rate between 60 and 100
			SystolicBP:       rand.Intn(51) + 90,                        // Random systolic BP between 90 and 140
			DiastolicBP:      rand.Intn(31) + 60,                        // Random diastolic BP between 60 and 90
			OxygenSaturation: float64(rand.Intn(11)+90) / 100.0 * 100.0, // Random oxygen saturation between 90 and 100%
		})
	}
	return metrics
}

// MetricsHandler handles the API requests for health metrics.
func MetricsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	metrics := GenerateMockData()
	json.NewEncoder(w).Encode(metrics)
}
