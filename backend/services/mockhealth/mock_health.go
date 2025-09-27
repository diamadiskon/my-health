package mockhealth

import (
	"fmt"
	"math/rand"
	"sync"
	"time"

	"my-health/initializers"
	"my-health/models"
)

var (
	updateInterval = 1 * time.Hour // Update metrics every hour
	workers        = make(map[uint]chan bool)
	workersMutex   sync.RWMutex
	generatorMutex sync.Mutex
	generatingFor  = make(map[uint]bool)
)

// generateStepsBasedOnTime generates step count based on time of day
func generateStepsBasedOnTime(t time.Time) int {
	hour := t.Hour()
	baseSteps := rand.Intn(2000) // Base random steps

	// Early morning (0-6): Very low activity
	if hour >= 0 && hour < 6 {
		return baseSteps / 4
	}
	// Morning (6-12): Moderate activity
	if hour >= 6 && hour < 12 {
		return baseSteps + rand.Intn(5000)
	}
	// Afternoon (12-18): High activity
	if hour >= 12 && hour < 18 {
		return baseSteps + rand.Intn(8000)
	}
	// Evening (18-24): Moderate to low activity
	return baseSteps + rand.Intn(4000)
}

// generateSleepData generates realistic sleep stage data
func generateSleepData() (models.SleepStages, float64) {
	// Generate sleep duration between 4-10 hours
	duration := 4.0 + rand.Float64()*6.0

	// Generate sleep stages percentages
	light := 45.0 + rand.Float64()*10.0 // ~45-55%
	deep := 20.0 + rand.Float64()*10.0  // ~20-30%
	rem := 25.0 + rand.Float64()*10.0   // ~25-35%
	awakeTime := rand.Intn(31)          // 0-30 minutes

	return models.SleepStages{
		Light:     light,
		Deep:      deep,
		REM:       rem,
		AwakeTime: awakeTime,
	}, duration
}

// generateOxygenLevel generates SpO2 levels with realistic probabilities
func generateOxygenLevel() float64 {
	r := rand.Float64() * 100
	if r < 2 { // 2% chance of severe hypoxia
		return 85.0 + rand.Float64()*5.0 // 85-90%
	}
	if r < 10 { // 8% chance of mild hypoxia
		return 90.0 + rand.Float64()*4.0 // 90-94%
	}
	// 90% chance of normal range
	return 95.0 + rand.Float64()*5.0 // 95-100%
}

// GenerateMockDataForPatient generates and stores mock data for a specific patient
var (
	// baseWeight stores the initial weight for each patient
	baseWeights     = make(map[uint]float64)
	baseWeightMutex sync.RWMutex
)

func getOrGenerateBaseWeight(patientID uint) float64 {
	baseWeightMutex.Lock()
	defer baseWeightMutex.Unlock()

	if weight, exists := baseWeights[patientID]; exists {
		return weight
	}

	// Generate a random base weight between 50-100 kg
	baseWeight := 50.0 + rand.Float64()*50.0
	baseWeights[patientID] = baseWeight
	return baseWeight
}

func GenerateMockDataForPatient(patientID uint, date time.Time) (*models.HealthMetrics, error) {
	// Initialize random seed with date, patient ID, and some additional entropy for more varied results
	rand.Seed(date.UnixNano() + int64(patientID) + time.Now().UnixNano()%1000)

	// Get base weight and add small daily variation
	baseWeight := getOrGenerateBaseWeight(patientID)
	weightVariation := (rand.Float64() - 0.5) * 0.3 // ±0.15 kg variation
	weight := baseWeight + weightVariation

	sleepStages, sleepDuration := generateSleepData()
	irregularRhythm := rand.Float64() < 0.05 // 5% chance
	fallDetected := rand.Float64() < 0.01    // 1% chance

	// More realistic vital signs
	heartRate := 70 + rand.Intn(21) // 70-90 bpm
	if rand.Float64() < 0.1 {       // 10% chance of higher/lower HR
		heartRate = heartRate + rand.Intn(21) - 10
	}

	systolicBP := 110 + rand.Intn(21) // 110-130 mmHg
	diastolicBP := 70 + rand.Intn(11) // 70-80 mmHg

	if rand.Float64() < 0.1 { // 10% chance of higher/lower BP
		systolicBP = systolicBP + rand.Intn(31) - 15
		diastolicBP = diastolicBP + rand.Intn(21) - 10
	}

	oxygenLevel := generateOxygenLevel()
	fmt.Printf("GenerateMockDataForPatient - PatientID: %d, Date: %v\n", patientID, date)
	fmt.Printf("Generated values - HR: %d, SBP: %d, DBP: %d, Oxygen: %.1f\n", heartRate, systolicBP, diastolicBP, oxygenLevel)

	metrics := &models.HealthMetrics{
		PatientID:        patientID,
		Date:             date,
		Weight:           weight,
		HeartRate:        heartRate,
		SystolicBP:       systolicBP,
		DiastolicBP:      diastolicBP,
		OxygenSaturation: oxygenLevel,
		StepsCount:       generateStepsBasedOnTime(date),
		Sleep:            sleepStages,
		SleepDuration:    sleepDuration,
		IrregularRhythm:  irregularRhythm,
		FallDetected:     fallDetected,
		BloodPressure:    fmt.Sprintf("%d/%d", systolicBP, diastolicBP),
	}

	return metrics, nil
}

// GenerateHistoricalData generates the last 30 days of data for a new patient
func GenerateHistoricalData(patientID uint) error {
	now := time.Now()
	var metrics []*models.HealthMetrics

	// Generate all metrics first
	for i := 30; i >= 0; i-- {
		date := now.AddDate(0, 0, -i)
		metric, err := GenerateMockDataForPatient(patientID, date)
		if err != nil {
			return fmt.Errorf("error generating mock data: %v", err)
		}
		metrics = append(metrics, metric)
	}

	// Batch insert all metrics
	batchSize := 10
	result := initializers.DB.CreateInBatches(metrics, batchSize)
	if result.Error != nil {
		return fmt.Errorf("error batch inserting metrics: %v", result.Error)
	}

	return nil
}

// StartPatientDataWorker starts a background worker for continuous data updates
func StartPatientDataWorker(patientID uint) {
	workersMutex.Lock()
	if _, exists := workers[patientID]; exists {
		workersMutex.Unlock()
		return
	}

	stopChan := make(chan bool)
	workers[patientID] = stopChan
	workersMutex.Unlock()

	go func() {
		ticker := time.NewTicker(updateInterval)
		defer ticker.Stop()

		for {
			select {
			case <-stopChan:
				return
			case <-ticker.C:
				if err := EnsureTodayDataExists(patientID); err != nil {
					fmt.Printf("Error updating data for patient %d: %v\n", patientID, err)
				}
			}
		}
	}()
}

// EnsureTodayDataExists checks and generates data for today if none exists
func EnsureTodayDataExists(patientID uint) error {
	// Check if we're already generating data for this patient
	generatorMutex.Lock()
	if generatingFor[patientID] {
		generatorMutex.Unlock()
		return nil
	}
	generatingFor[patientID] = true
	generatorMutex.Unlock()

	defer func() {
		generatorMutex.Lock()
		delete(generatingFor, patientID)
		generatorMutex.Unlock()
	}()

	// Clean up ALL corrupted data for this patient (one-time operation)
	var corruptedMetrics []models.HealthMetrics
	if err := initializers.DB.Where("patient_id = ? AND heart_rate = 0", patientID).Find(&corruptedMetrics).Error; err == nil {
		if len(corruptedMetrics) > 0 {
			fmt.Printf("Found %d corrupted records for patient %d, cleaning up...\n", len(corruptedMetrics), patientID)
			for _, metric := range corruptedMetrics {
				fmt.Printf("Deleting corrupted data for date %v (HR=0)\n", metric.Date.Format("2006-01-02"))
				if err := initializers.DB.Delete(&metric).Error; err != nil {
					fmt.Printf("Error deleting corrupted metric: %v\n", err)
				}
			}
		}
	}

	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)
	var count int64

	// Check if data exists for today (between today 00:00 and tomorrow 00:00)
	if err := initializers.DB.Model(&models.HealthMetrics{}).
		Where("patient_id = ? AND date >= ? AND date < ?", patientID, today, tomorrow).
		Count(&count).Error; err != nil {
		return err
	}

	// If no data exists for today, generate it
	if count == 0 {
		// Use current time for today's data instead of truncated time
		now := time.Now()
		fmt.Printf("Generating new data for patient %d for date %v\n", patientID, now)
		metric, err := GenerateMockDataForPatient(patientID, now)
		if err != nil {
			return fmt.Errorf("error generating mock data: %v", err)
		}

		fmt.Printf("Generated metric: HR=%d, SystolicBP=%d, DiastolicBP=%d, Oxygen=%.1f\n",
			metric.HeartRate, metric.SystolicBP, metric.DiastolicBP, metric.OxygenSaturation)

		if err := initializers.DB.Create(metric).Error; err != nil {
			return fmt.Errorf("error saving today's metrics: %v", err)
		}
		fmt.Printf("Successfully saved metric to database\n")
	} else {
		fmt.Printf("Valid data already exists for patient %d today (count: %d)\n", patientID, count)
	}

	return nil
}
