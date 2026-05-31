package com.challengerewards.repo;

import com.challengerewards.domain.Submission;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionRepo extends JpaRepository<Submission, String> {
    List<Submission> findByChallengeId(String challengeId);
}
