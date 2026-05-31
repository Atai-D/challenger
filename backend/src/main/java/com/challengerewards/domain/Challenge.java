package com.challengerewards.domain;

import com.challengerewards.domain.Enums.ChallengeStatus;
import com.challengerewards.domain.Enums.ModerationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "challenge")
public class Challenge {
    @Id
    public String id;
    public String orgId;
    public String title;
    @Column(length = 2000)
    public String description;
    public String category;
    @Enumerated(EnumType.STRING)
    public ModerationType moderationType;
    public String rewardLabel;
    public int capacity;
    public String startDate;
    public String endDate;
    public long createdAt;
    @Enumerated(EnumType.STRING)
    public ChallengeStatus status;
    public Long reviewedAt;
    @Column(length = 1000)
    public String reviewerNote;
}
