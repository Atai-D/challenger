package com.challengerewards.repo;

import com.challengerewards.domain.Challenge;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChallengeRepo extends JpaRepository<Challenge, String> {}
