package com.challengerewards.repo;

import com.challengerewards.domain.Participation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParticipationRepo extends JpaRepository<Participation, String> {
    List<Participation> findByChallengeId(String challengeId);

    List<Participation> findByChallengeIdAndUserId(String challengeId, String userId);
}
