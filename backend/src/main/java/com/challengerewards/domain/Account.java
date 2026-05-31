package com.challengerewards.domain;

import com.challengerewards.domain.Enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_account")
public class Account {
    @Id
    public String id;

    @Column(unique = true, nullable = false)
    public String username;

    // Plain-text for the hackathon demo only. Do not do this in production.
    public String password;

    @Enumerated(EnumType.STRING)
    public Role role;

    // Links to AppUser.id (USER) or Organization.id (ORG); null for ADMIN.
    public String subjectId;

    public String displayName;
}
