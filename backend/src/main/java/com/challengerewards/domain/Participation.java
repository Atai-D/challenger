package com.challengerewards.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "participation")
public class Participation {
    @Id
    public String id;
    public String challengeId;
    public String userId;
    public long joinedAt;
}
