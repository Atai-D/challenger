package com.challengerewards.domain;

import com.challengerewards.domain.Enums.CouponStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "coupon")
public class Coupon {
    @Id
    public String id;
    public String code;
    public String challengeId;
    public String userId;
    public String orgId;
    public String label;
    @Enumerated(EnumType.STRING)
    public CouponStatus status;
    public long createdAt;
    public long expiresAt;
    public Long redeemedAt;
}
