package com.challengerewards.domain;

import com.challengerewards.domain.Enums.ModerationType;
import com.challengerewards.domain.Enums.SubmissionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "submission")
public class Submission {
    @Id
    public String id;
    public String challengeId;
    public String userId;
    @Enumerated(EnumType.STRING)
    public ModerationType type;
    @Column(length = 2000)
    public String note;
    @Lob
    @Column(name = "proof_image")
    public String proofImage;
    @Enumerated(EnumType.STRING)
    public SubmissionStatus status;
    public long createdAt;
    public Long reviewedAt;
    @Column(length = 1000)
    public String reviewerNote;
}
