package models

import "github.com/golang-jwt/jwt/v4"

type Claims struct {
	UserID uint   `json:"user_id"` // Changed from string to uint to match User.ID
	Role   string `json:"role"`
	jwt.StandardClaims
}
